<?php

namespace Component\Grid;
use DataHandle\Request;

/**
 * Search field for grid
 */
class SearchField extends \Component\Component
{

    /**
     * Alias to grid
     * @var \Component\Grid\SearchGrid
     */
    protected $grid;

    /**
     * Extra filters
     * @var array
     */
    protected $extraFilters;

    /**
     * Construct the Search field.
     *
     * @param \View\Page $dom
     * @param \Component\Grid\Grid $grid
     * @param string $class
     */
    public function __construct($grid = NULL)
    {
        $this->setGrid($grid);

        parent::__construct('searchHead', null);
    }

    function getExtraFilters()
    {
        return $this->extraFilters;
    }

    function setExtraFilters($extraFilters)
    {
        if (!is_array($extraFilters))
        {
            $extraFilters = array($extraFilters);
        }

        $this->extraFilters = $extraFilters;
    }

    function addExtraFilter($extraFilter)
    {
        $this->extraFilters[] = $extraFilter;
    }

    public function onCreate()
    {
        //avoid double creation
        if ($this->isCreated())
        {
            return $this->getContent();
        }

        $innerHtml[] = $this->getInput('q', 'buscar');

        if ($this->extraFilters)
        {
            $innerHtml[] = $this->extraFilters;
        }

        $innerHtml[] = $this->getAdvancedFilters();

        $views[] = new \View\Div('containerHead', $innerHtml, 'input-append');

        $div = new \View\Div('searchHead', $views);

        $this->setContent($div);

        return $div;
    }

    public function getGrid()
    {
        return $this->grid;
    }

    public function setGrid($grid)
    {
        $this->grid = $grid;
        return $this;
    }

    public function getSearchButton()
    {
        $params['orderBy'] = Request::get('orderBy');
        $params['orderWay'] = Request::get('orderWay');
        $params = http_build_query($params);

        $url = 'g(\'' . $this->grid->getLink(NULL, NULL, NULL, false) . '\',\'' . $params . '\'+ \'&\' + $(\'form\').serialize())';

        $btnSearch = new \View\Ext\Button('buscar', 'search', 'Buscar', $url, '', 'Clique para pesquisa');
        $btnSearch->setTitle('Buscar');

        return $btnSearch;
    }

    /**
     * Mount the input of search
     *
     * @param string $idQuestion
     * @param string $idBtn
     * @return \View\Input
     */
    protected function getInput($idQuestion, $idBtn)
    {
        $search = new \View\Input($idQuestion, \View\Input::TYPE_SEARCH, Request::get($idQuestion));

        $search->setAttribute('placeholder', 'Pesquisar...')
                ->setClass('search span3')
                ->setValue(Request::get($idQuestion))
                ->setTitle('Digite o conteúdo a buscar...')
                ->onPressEnter('$("#' . $idBtn . '").click();');

        return $search;
    }

    /**
     * Mount the advance filters
     *
     * @param string $idQuestion
     * @param string $idBtn
     * @return \View\Div
     */
    protected function getAdvancedFilters()
    {
        $filterContent = NULL;
        $grid = $this->getGrid();
        $dom = \View\View::getDom();
        $dbModel = null;

        //detected if page has get model method
        if (method_exists($dom, 'getModel'))
        {
            $dbModel = $dom->getModel();
        }

        $result[] = $this->getSearchButton();
        $filter = new \View\Ext\Icon('filter');
        $filter->setId('advanced-filter');
        $filter->click('$("#fm-filters").toggle(\'fast\');');

        $result[] = $filter;

        $filters = \Component\Grid\MountFilter::getFilters($grid->getColumns(), $dbModel);

        $fMenu = new \View\Blend\FloatingMenu('fm-filters');
        $fMenu->hide();

        $filter->append($fMenu);

        $pageUrl = \View\View::getDom()->getPageUrl();

        if (is_array($filters))
        {
            foreach ($filters as $filter)
            {
                $url = "p('$pageUrl/addAdvancedFilter/{$filter->getFilterName()}');";
                $fMenu->addItem(null, null, $filter->getFilterLabel(), $url);

                $filterNameCondition = $filter->getFilterName() . 'Condition';
                $filterNameValue = $filter->getFilterName() . 'Value';

                //create the filter if not ajax (reload (F5))
                if (Request::get($filterNameCondition) || Request::get($filterNameValue) || Request::get($filterNameValue) === '0' || $filter->getFilterType() . '' == '2')
                {
                    $filterContent[] = $filter->getInput()->append(\Page\Page::getCloseFilterButton());
                }
            }
        }

        \App::addJs("$('.filterCondition').change();");
        $result[] = new \View\Div('containerFiltros', $filterContent, 'clearfix');

        return $result;
    }

    public function listAvoidPropertySerialize()
    {
        $avoid = parent::listAvoidPropertySerialize();
        $avoid[] = 'grid';
        $avoid[] = 'created';
        $avoid[] = 'extraFilters';

        return $avoid;
    }

}