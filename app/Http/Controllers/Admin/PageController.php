<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Http\Requests\Admin\StorePageRequest;
use App\Services\Storefront\PageContent;
use Inertia\Inertia;

class PageController extends Controller
{
    public function __construct(private readonly PageContent $content) {}

    public function index()
    {
        return Inertia::render('Admin/Pages/Index', [
            'pages' => Page::orderBy('id')->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Pages/Form', [
            'page' => null,
            'supportedPages' => PageContent::PAGES,
        ]);
    }

    public function store(StorePageRequest $request)
    {
        $data = $request->validated();
        $data['sections'] = $this->content->sanitizeSections($data['sections'] ?? []);

        Page::create($data);
        return redirect()->route('pages.index')->with('success', 'Página creada.');
    }

    public function edit(Page $page)
    {
        return Inertia::render('Admin/Pages/Form', [
            'page' => $page,
            'supportedPages' => PageContent::PAGES,
        ]);
    }

    public function update(StorePageRequest $request, Page $page)
    {
        $data = $request->validated();
        $data['sections'] = $this->content->sanitizeSections($data['sections'] ?? []);

        $page->update($data);
        return redirect()->route('pages.index')->with('success', 'Página actualizada.');
    }

    public function destroy(Page $page)
    {
        $page->delete();
        return redirect()->route('pages.index')->with('success', 'Página eliminada.');
    }
}
