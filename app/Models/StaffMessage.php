<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffMessage extends Model
{
    use \Illuminate\Database\Eloquent\SoftDeletes;
    protected $table = 'staff_messages';

    protected $fillable = [
        'thread_id',
        'user_id',
        'request_id',
        'body',
        'reply_to_id',
        'important',
        'edited_at',
        'payload_hash',
        'call_id',
    ];

    protected $hidden = ['payload_hash'];

    protected $casts = ['important' => 'boolean', 'edited_at' => 'datetime'];

    public function thread()
    {
        return $this->belongsTo(StaffThread::class, 'thread_id');
    }

    public function user()
    {
        return $this->belongsTo(Usuario::class, 'user_id');
    }

    public function attachments()
    {
        return $this->hasMany(StaffMessageAttachment::class, 'staff_message_id');
    }
}
