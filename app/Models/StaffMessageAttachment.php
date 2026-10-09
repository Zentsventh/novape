<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffMessageAttachment extends Model
{
    protected $table = 'staff_message_attachments';

    protected $fillable = [
        'staff_message_id',
        'type',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'duration',
        'call_status',
        'storage_disk',
        'sha256',
    ];

    protected $hidden = ['file_path', 'storage_disk', 'sha256'];

    public function message()
    {
        return $this->belongsTo(StaffMessage::class, 'staff_message_id');
    }

    public function getUrlAttribute()
    {
        if (! $this->file_path || $this->type === 'call') return null;
        return route('admin.team.attachment', $this->id);
    }
}
