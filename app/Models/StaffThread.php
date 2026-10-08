<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffThread extends Model
{
    protected $table = 'staff_threads';

    protected $fillable = [
        'title',
        'direct_key',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(Usuario::class, 'created_by');
    }

    public function members()
    {
        return $this->belongsToMany(Usuario::class, 'staff_thread_members', 'thread_id', 'user_id')
                    ->withPivot(['last_read_id', 'pinned', 'muted', 'archived', 'typing_until']);
    }

    public function messages()
    {
        return $this->hasMany(StaffMessage::class, 'thread_id');
    }
}
