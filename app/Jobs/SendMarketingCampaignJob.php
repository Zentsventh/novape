<?php

namespace App\Jobs;

use App\Models\MarketingCampaign;
use App\Models\Usuario;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class SendMarketingCampaignJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 60;

    public int $tries = 3;

    public function __construct(
        public MarketingCampaign $campaign
    ) {}

    public function handle(): void
    {
        if ($this->campaign->fresh()?->status !== 'sending') {
            return;
        }
        $query = \App\Services\Marketing\MarketingConsent::audience();

        if ($this->campaign->segment === 'vip') {
            $query->where('total_orders', '>=', 5);
        } elseif ($this->campaign->segment === 'at_risk') {
            $query->where('last_order_date', '<', now()->subDays(90));
        }

        $query->select('id', 'email')->chunkById(200, function ($users) {
            foreach ($users as $user) {
                DB::table('marketing_deliveries')->insertOrIgnore([
                    'campaign_id' => $this->campaign->id, 'usuario_id' => $user->id, 'email' => $user->email,
                    'status' => 'pending', 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        });
        $this->campaign->update(['target_count' => DB::table('marketing_deliveries')->where('campaign_id', $this->campaign->id)->count()]);
        DB::table('marketing_deliveries')->where('campaign_id', $this->campaign->id)->where('status', 'pending')
            ->orderBy('id')->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    SendMarketingRecipientJob::dispatch($row->id);
                }
            });
        SendMarketingRecipientJob::refreshCampaign($this->campaign->id);
    }
}
