<?php

namespace App\Policies;

use App\Models\Entry;
use App\Models\User;

class EntryPolicy
{
    /**
     * Determine whether the user can update the entry.
     */
    public function update(User $user, Entry $entry): bool
    {
        return $user->is($entry->user);
    }

    /**
     * Determine whether the user can delete the entry.
     */
    public function delete(User $user, Entry $entry): bool
    {
        return $user->is($entry->user);
    }
}
