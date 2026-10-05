<?php
namespace App\Domain\Shared;

use Illuminate\Database\Eloquent\Model;

/**
 * Base repository implementing the generic RepositoryInterface using Eloquent.
 */
class BaseRepository implements RepositoryInterface
{
    /** @var \Illuminate\Database\Eloquent\Builder */
    protected $query;

    public function __construct(Model $model)
    {
        $this->query = $model->newQuery();
    }

    public function all()
    {
        return $this->query->get();
    }

    public function find(string $id)
    {
        return $this->query->find($id);
    }

    public function create(array $data)
    {
        return $this->query->getModel()::create($data);
    }

    public function update(string $id, array $data)
    {
        $model = $this->find($id);
        $model->update($data);
        return $model;
    }

    public function paginate(int $perPage = 20)
    {
        return $this->query->paginate($perPage);
    }
}
?>
