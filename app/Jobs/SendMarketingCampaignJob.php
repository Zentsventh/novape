<?php

namespace App\Jobs;

use App\Mail\MarketingCampaignMail;
use App\Models\MarketingCampaign;
use App\Models\Usuario;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendMarketingCampaignJob implements ShouldQueue
{
    use Queueable;

    public $timeout = 3600;

    public function __construct(
        public MarketingCampaign $campaign
    ) {}

    public function handle(): void
    {
        $query = Usuario::whereHas('roles', fn ($q) => $q->where('nombre', 'cliente'))
            ->where('estado', 'activo')
            ->whereNotNull('email');

        if ($this->campaign->segment === 'vip') {
            $query->where('total_orders', '>=', 5);
        } elseif ($this->campaign->segment === 'at_risk') {
            $query->where('last_order_date', '<', now()->subDays(90));
        }

        $users = $query->get();
        $sentCount = 0;
        $failedCount = 0;

        foreach ($users as $user) {
            try {
                Mail::to($user->email)->send(new MarketingCampaignMail($this->campaign, $user));
                $sentCount++;
            } catch (\Exception $e) {
                $failedCount++;
                Log::warning('Fallo de envío de campaña', ['campaign_id' => $this->campaign->id, 'user_id' => $user->id]);
            }
        }

        $this->campaign->update([
            'status' => $failedCount > 0 ? 'failed' : 'sent',
            'sent_count' => $sentCount,
            'finished_at' => now(),
        ]);
    }
}
