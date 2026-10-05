<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('business_automation_settings', function (Blueprint $table) {
            $table->id(); $table->json('settings'); $table->timestamps();
        });
        Schema::create('business_workflows', function (Blueprint $table) {
            $table->id(); $table->string('name', 120); $table->string('scope', 20); $table->string('trigger', 40);
            $table->boolean('enabled')->default(false); $table->unsignedInteger('priority')->default(100);
            $table->json('conditions'); $table->json('actions'); $table->unsignedInteger('version')->default(1); $table->timestamps();
        });
        Schema::create('business_workflow_versions', function (Blueprint $table) {
            $table->id(); $table->foreignId('workflow_id')->constrained('business_workflows');
            $table->unsignedInteger('version'); $table->json('definition'); $table->bigInteger('actor_id')->nullable();
            $table->timestamp('created_at'); $table->unique(['workflow_id', 'version']);
        });
        Schema::create('business_automation_runs', function (Blueprint $table) {
            $table->id(); $table->string('event_key', 64)->nullable()->unique(); $table->string('scope', 20); $table->string('trigger', 40);
            $table->unsignedBigInteger('conversation_id')->nullable()->index(); $table->bigInteger('actor_id')->nullable()->index();
            $table->string('status', 30); $table->boolean('dry_run')->default(false);
            $table->json('context'); $table->json('actions'); $table->json('matched_rules'); $table->json('results')->nullable();
            $table->text('error')->nullable(); $table->timestamps();
        });
        Schema::create('business_automation_steps', function (Blueprint $table) {
            $table->id(); $table->foreignId('run_id')->constrained('business_automation_runs')->cascadeOnDelete();
            $table->string('step_key', 64); $table->string('status', 30); $table->json('result')->nullable(); $table->timestamps();
            $table->unique(['run_id', 'step_key']);
        });
        Schema::create('automation_conversation_states', function (Blueprint $table) {
            $table->foreignId('conversation_id')->primary()->constrained('omnichannel_conversations')->cascadeOnDelete();
            $table->json('state'); $table->timestamp('updated_at');
        });
        foreach ([
            ['Compra de alto valor', [['field' => 'amount', 'operator' => 'gt', 'value' => '$high_value_threshold']], 'premium'],
            ['Compra por volumen', [['field' => 'quantity', 'operator' => 'gte', 'value' => '$bulk_quantity_threshold']], 'mayorista'],
            ['Atención de empresas', [['field' => 'is_company', 'operator' => 'eq', 'value' => true]], 'empresa'],
        ] as [$name, $conditions, $tag]) {
            DB::table('business_workflows')->insert(['name' => $name, 'scope' => 'all', 'trigger' => 'incoming_message', 'enabled' => true, 'priority' => 10,
                'conditions' => json_encode($conditions), 'actions' => json_encode([['type' => 'qualify_lead', 'config' => []], ['type' => 'offer_appointment', 'config' => []], ['type' => 'tag', 'config' => ['tag' => $tag]]]),
                'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        }
        DB::table('business_workflows')->insert(['name' => 'Crear seguimiento desde el asistente', 'scope' => 'panel', 'trigger' => 'panel_query', 'enabled' => true, 'priority' => 50,
            'conditions' => json_encode([['field' => 'text', 'operator' => 'contains', 'value' => 'crear seguimiento']]),
            'actions' => json_encode([['type' => 'create_task', 'config' => ['text' => 'Seguimiento solicitado: {text}']]]), 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        foreach (DB::table('business_workflows')->get() as $workflow) {
            DB::table('business_workflow_versions')->insert(['workflow_id' => $workflow->id, 'version' => 1, 'definition' => json_encode($workflow), 'created_at' => now()]);
        }
    }

    public function down(): void
    {
        foreach (['automation_conversation_states', 'business_automation_steps', 'business_automation_runs', 'business_workflow_versions', 'business_workflows', 'business_automation_settings'] as $table) Schema::dropIfExists($table);
    }
};
