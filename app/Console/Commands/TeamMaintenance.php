<?php

namespace App\Console\Commands;

use App\Services\Team\TeamCalls;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TeamMaintenance extends Command
{
    protected $signature = 'team:maintenance {--secure-files : Move legacy public team files into private storage}';

    protected $description = 'Expire abandoned team calls, prune transient signaling and secure legacy attachments';

    public function handle(TeamCalls $calls): int
    {
        $calls->expire();
        DB::table('staff_call_signals')->where('created_at', '<', now()->subHours(2))->delete();
        if ($this->option('secure-files')) {
            $count = 0;
            foreach (DB::table('staff_message_attachments')->where('storage_disk', 'public')->where('type', '!=', 'call')->get() as $file) {
                if (! str_starts_with($file->file_path, 'team-chat/') || str_contains($file->file_path, '..')) {
                    $this->error('Invalid attachment path: '.$file->id);

                    return self::FAILURE;
                }
                $public = Storage::disk('public');
                $private = Storage::disk('local');
                if (! $public->exists($file->file_path)) {
                    $this->warn('Missing legacy attachment: '.$file->id);

                    continue;
                }
                $stream = $public->readStream($file->file_path);
                try {
                    if (! $private->put($file->file_path, $stream)) {
                        throw new \RuntimeException('Private copy failed');
                    }
                } finally {
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                }
                $hash = hash_file('sha256', $public->path($file->file_path));
                if (! hash_equals($hash, hash_file('sha256', $private->path($file->file_path)))) {
                    throw new \RuntimeException('Attachment integrity mismatch');
                }
                DB::table('staff_message_attachments')->where('id', $file->id)->update(['storage_disk' => 'local', 'sha256' => $hash]);
                $public->delete($file->file_path);
                $count++;
            }
            $this->info('Private attachments migrated: '.$count);
        }
        $this->info('Team maintenance complete.');

        return self::SUCCESS;
    }
}
