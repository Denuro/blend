<?php

namespace Component\Grid;

/**
 * Search grid used in search crud forms
 *
 * @author eduardo
 */
class SearchGrid extends \Component\Grid\Grid
{

    /**
     * Call interface functions.
     * Used for optimizations
     *
     * @var boolean
     */
    protected $callInterfaceFunctions = TRUE;

    /**
     * Search field
     * @var \Component\Grid\SearchField
     */
    protected $searchField = NULL;

    public function __construct($id = NULL, $dataSource = NULL, $class = 'grid', $columns = NULL)
    {
        $myId = $id ? $id : get_class($this);
        parent::__construct($myId, $dataSource, $class);

        //solve a creep bug
        if ($columns)
        {
            $this->setColumns($columns);
        }

        $this->setSearchField($this->createSearchField());
    }

    public function isGrouped()
    {
        return \DataHandle\Request::get('grid-groupby-field') ? true : false;
    }

    public function isUserAddedColumns()
    {
        return \DataHandle\Request::get('grid-addcolumn-field') ? true : false;
    }

    protected function createSearchField()
    {
        return new \Component\Grid\SearchField($this);
    }

    public function addFilter($filters)
    {
        $this->searchField->addExtraFilter($filters);
    }

    /**
     * Get filter by name
     * @param string $filterName filter name
     * @return  \Filter\Text
     */
    function getFilter($filterName)
    {
        $filter = $this->searchField->getExtraFilter($filterName);

        if (!$filter)
        {
            return new \Filter\Text();
        }

        return $filter;
    }

    /**
     * Remove an filter
     * @param strring $filterName filter name
     *
     * @return $this
     */
    function removeFilter($filterName)
    {
        $this->searchField->getRemoveFilter($filterName);

        return $this;
    }

    /**
     * Return an array with all filter
     *
     * @return array
     */
    function getFilters()
    {
        return $this->searchField->getExtraFilters();
    }

    /**
     * Define/overwrite all filter
     * @param array $filters array of filter
     * @return $this
     */
    function setFilters($filters)
    {
        $this->searchField->setExtraFilters($filters);

        return $this;
    }

    /**
     * Make the creation of the grid
     *
     * @return \Component\Grid
     */
    public function onCreate()
    {
        //avoid double creation
        if ($this->isCreated())
        {
            return $this->getContent();
        }

        $div = $this->createTable();
        $searchField = $this->getSearchField();
        $this->setContent(array($searchField, $div));

        return $this->content;
    }

    public function getSearchField()
    {
        return $this->searchField;
    }

    public function setSearchField($searchField)
    {
        //make it work from json serialization
        if ($searchField)
        {
            $searchField->setGrid($this);
        }

        $this->searchField = $searchField;

        return $this;
    }

    public function getCallInterfaceFunctions()
    {
        return $this->callInterfaceFunctions;
    }

    public function setCallInterfaceFunctions($callInterfaceFunctions)
    {
        $this->callInterfaceFunctions = $callInterfaceFunctions;
    }

    protected function createTd(\Component\Grid\Column $column, $index, $item, $tr)
    {
        $dom = \View\View::getDom();
        $td = parent::createTd($column, $index, $item, $tr);

        //from page
        if ($this->getCallInterfaceFunctions() && $dom instanceof \Page\AfterGridCreateCell)
        {
            \View\View::getDom()->afterGridCreateCell($column, $item, $index, $tr, $td);
        }

        //from grid
        if ($this instanceof \Page\AfterGridCreateCell)
        {
            $this->afterGridCreateCell($column, $item, $index, $tr, $td);
        }

        return $td;
    }

    protected function createTr($columns, $index, $item)
    {
        $dom = \View\View::getDom();

        if (!$this->isGrouped())
        {
            //from page
            if ($this->getCallInterfaceFunctions() && $dom instanceof \Page\BeforeGridCreateRow)
            {
                $dom->beforeGridCreateRow($item, $index, NULL);
            }

            //from grid
            if ($this instanceof \Page\BeforeGridCreateRow)
            {
                $this->beforeGridCreateRow($item, $index, null);
            }
        }

        $tr = parent::createTr($columns, $index, $item);

        if (!$this->isGrouped())
        {
            //from page
            if ($this->getCallInterfaceFunctions() && $dom instanceof \Page\AfterGridCreateRow)
            {
                \View\View::getDom()->afterGridCreateRow($item, $index, $tr);
            }

            //from grid
            if ($this instanceof \Page\AfterGridCreateRow)
            {
                $this->afterGridCreateRow($item, $index, $tr);
            }
        }

        return $tr;
    }

}
