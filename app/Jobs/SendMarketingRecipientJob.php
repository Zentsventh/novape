<?php

namespace App\Jobs;

use App\Mail\MarketingCampaignMail;
use App\Models\MarketingCampaign;
use App\Models\Usuario;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendMarketingRecipientJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 45;

    public int $tries = 1;

    public function __construct(public int $deliveryId) {}

    public function handle(): void
    {
        $claimed = DB::table('marketing_deliveries')->where('id', $this->deliveryId)->where('status', 'pending')
            ->update(['status' => 'sending', 'attempts' => DB::raw('attempts + 1'), 'updated_at' => now()]);
        if (! $claimed) {
            return;
        }
        $row = DB::table('marketing_deliveries')->where('id', $this->deliveryId)->firstOrFail();
        try {
            $user = Usuario::findOrFail($row->usuario_id);
            if ($user->estado !== 'activo' || ! filter_var($row->email, FILTER_VALIDATE_EMAIL)) {
                throw new \RuntimeException('Destinatario inactivo o correo inválido.');
            }
            Mail::to($row->email)->send(new MarketingCampaignMail(MarketingCampaign::findOrFail($row->campaign_id), $user));
            DB::table('marketing_deliveries')->where('id', $this->deliveryId)->update(['status' => 'sent', 'sent_at' => now(), 'updated_at' => now()]);
        } catch (\Throwable $e) {
            DB::table('marketing_deliveries')->where('id', $this->deliveryId)->update(['status' => 'failed', 'error' => mb_substr($e->getMessage(), 0, 1000), 'updated_at' => now()]);
            report($e);
        } finally {
            self::refreshCampaign($row->campaign_id);
        }
    }

    public static function refreshCampaign(int $campaignId): void
    {
        DB::transaction(function () use ($campaignId) {
            $campaign = MarketingCampaign::whereKey($campaignId)->lockForUpdate()->first();
            if (! $campaign) {
                return;
            }
            $rows = DB::table('marketing_deliveries')->where('campaign_id', $campaignId);
            $sent = (clone $rows)->where('status', 'sent')->count();
            $unfinished = (clone $rows)->whereIn('status', ['pending', 'sending'])->exists();
            $failed = (clone $rows)->where('status', 'failed')->exists();
            $campaign->update(['sent_count' => $sent, 'status' => $unfinished ? 'sending' : ($failed ? 'failed' : 'sent'), 'finished_at' => $unfinished ? null : now()]);
        });
    }
}
