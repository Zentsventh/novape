<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\MarketingCampaign;
use App\Models\Usuario;
use App\Mail\MarketingCampaignMail;
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
        $query = Usuario::whereHas('roles', fn($q) => $q->where('nombre', 'cliente'))
            ->whereNotNull('email');

        if ($this->campaign->segment === 'vip') {
            $query->where('total_orders', '>=', 5);
        } elseif ($this->campaign->segment === 'at_risk') {
            $query->where('last_order_date', '<', now()->subDays(90));
        }

        $users = $query->get();
        $sentCount = 0;

        foreach ($users as $user) {
            try {
                Mail::to($user->email)->send(new MarketingCampaignMail($this->campaign, $user));
                $sentCount++;
            } catch (\Exception $e) {
                // Log failed email if needed
            }
        }

        $this->campaign->update([
            'status' => 'sent',
            'sent_count' => $sentCount,
            'finished_at' => now(),
        ]);
    }
}
