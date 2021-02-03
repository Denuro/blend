<?php

namespace Component\Grid;

/**
 * Mount an automatic grid filter base on a \Component\Grid\Column and a \Db\Model
 */
class MountFilter
{

    /**
     * Grid column
     * @var \Component\Grid\Column
     */
    private $column;

    /**
     * Model
     * @var \Db\Model
     */
    private $dbModel;

    /**
     * Mount one grid filter
     *
     * @param \Component\Grid\Column $column
     * @param \Db\Model $dbModel
     */
    public function __construct($column, $dbModel)
    {
        $this->column = $column;
        $this->dbModel = $dbModel;
    }

    public function getColumn()
    {
        return $this->column;
    }

    public function getDbModel()
    {
        return $this->dbModel;
    }

    public function setColumn($column)
    {
        $this->column = $column;
        return $this;
    }

    public function setDbModel($dbModel)
    {
        $this->dbModel = $dbModel;
        return $this;
    }

    /**
     * Return an filter based on a grid column and model
     *
     * @return \Component\Grid\filterClass
     */
    public function getFilter()
    {
        $column = $this->column;
        $column instanceof \Component\Grid\Column;

        if (!$column)
        {
            return NULL;
        }

        //avoid columns that end with description
        if (strpos($column->getName(), 'Description') > 0)
        {
            return null;
        }

        $filter = NULL;
        $dbModel = $this->dbModel;
        $dataType = $column->getType();
        $filterType = $column->getFilterType();
        $dbColumn = null;

        //don't mount filter if column don't has data type, or if don't have to be filtered
        if (!$dataType || !$filterType)
        {
            return NULL;
        }

        //try to get column from database/model
        if ($dbModel instanceof \Db\Model)
        {
            $realColumnName = \Db\Column\Column::getRealColumnName($column->getName());
            $dbColumn = $dbModel::getColumn($realColumnName);
        }

        //verify if is needed to mount the filter by database/model column
        if ($dbColumn instanceof \Db\Column\Column)
        {
            $filterClassName = $dbColumn->getFilterClassName();
            $filter = new $filterClassName($column);
            $filter->setFilterType($filterType);

            if (method_exists($filter, 'setDbColumn'))
            {
                $filter->setDbColumn($dbColumn);
            }
        }

        //if not find in model, create a default filter based on column type
        //it's the default fallback
        if (!$filter)
        {
            $filterClass = \Component\Grid\MountFilter::getFilterClass($column);

            $filter = new $filterClass($column, NULL, $filterType);
        }

        return $filter;
    }

    public static function getFilterClass(\Component\Grid\Column $column)
    {
        $dataType = $column->getType() == 'bool' ? 'boolean' : $column->getType();
        $formatter = $column->getFormatter();

        if ($formatter instanceof \Type\DateTime)
        {
            $dataType = 'datetime';
        }
        else if ($formatter instanceof \Db\ConstantValues)
        {
            $dataType = 'reference';
        }

        $filterClass = '\\Filter\\' . ucfirst($dataType);

        return $filterClass;
    }

    /**
     * Static method to construct an array of filters
     *
     * @param array $columns
     * @param \Dd\Model $dbModel
     * @return array
     */
    public static function getFilters($columns, $dbModel, $fixedFilters = null)
    {
        $filters = $fixedFilters;

        if (!is_array($columns))
        {
            return NULL;
        }

        $extraFilters = array();

        if (is_array($fixedFilters))
        {
            foreach ($fixedFilters as $filter)
            {
                if ($filter instanceof \Filter\Text)
                {
                    $extraFilters[] = $filter->getFilterName();
                }
            }
        }

        //prepare filters to an array
        foreach ($columns as $column)
        {
            //step by the columsn that is not filtered
            if (!$column->getFilter())
            {
                continue;
            }

            $mountFilter = new \Component\Grid\MountFilter($column, $dbModel);
            $filter = $mountFilter->getFilter();

            //avoid create two filters for the same column
            if (is_array($filter))
            {
                foreach ($filter as $filt)
                {
                    if (!in_array($filt->getFilterName(), $extraFilters))
                    {
                        $filters[$filt->getFilterName()] = $filt;
                    }
                }
            }
            else if ($filter)
            {
                if (!in_array($filter->getFilterName(), $extraFilters))
                {
                    $filters[$filter->getFilterName()] = $filter;
                }
            }
        }

        return $filters;
    }

}
