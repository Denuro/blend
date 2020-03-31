<?php

namespace DataSource;

/**
 * QueryBuilder datasource
 */
class QueryBuilder extends DataSource
{

    /**
     *
     * @var \Db\QueryBuilder
     */
    protected $queryBuilder;

    /**
     *
     * @var \Db\Collection
     */
    protected $data;

    public function __construct($queryBuilder = NULL)
    {
        $this->setQueryBuilder($queryBuilder);
    }

    public function getQueryBuilder()
    {
        return $this->queryBuilder;
    }

    public function setQueryBuilder(\Db\QueryBuilder $queryBuilder)
    {
        $this->queryBuilder = $queryBuilder;
        return $this;
    }

    public function getQueryBuilderFeeded()
    {
        $qBuilder = clone($this->getQueryBuilder());
        $qBuilder instanceof \Db\QueryBuilder;
        $qBuilder->orderBy($this->getOrderBy(), $this->getOrderWay())
                ->limit($this->getLimit(), $this->getOffset())
                ->addWhere($this->getExtraFilter());

        $filters = $this->mountSmartFilters();

        $qBuilder->addWhere($filters);

        return $qBuilder;
    }

    /**
     * Mount the smart function
     *
     * @return array of \Db\Filter
     */
    public function mountSmartFilters()
    {
        $callBack = $this->getSmartFilterCallback();

        if ($callBack)
        {
            return $callBack($this);
        }

        $qBuilder = $this->getQueryBuilder();
        $modelName = $qBuilder->getModelName();

        //workaround to make it work like a default model
        if ($modelName)
        {
            $smartFilter = new \Db\SmartFilter($modelName, $this->getSelectedModelColumns(), $this->getSmartFilter());
            return $smartFilter->createFilters();
        }

        return null;
    }

    protected function getQueryColumnByRealname($realColumnName)
    {
        $qBuilder = $this->getQueryBuilder();
        $columns = $qBuilder->getColumns();

        foreach ($columns as $column)
        {
            $realName = \Db\Column\Column::getRealColumnName($column);

            if ($realColumnName == $realName)
            {
                return $column;
            }
        }
    }

    public function executeAggregator(Aggregator $aggregator)
    {
        $qBuilder = $this->getQueryBuilderFeeded();
        $realName = $aggregator->getColumnName();
        $sqlColumn = $this->getQueryColumnByRealname($realName);
        $sqlColumn = \Db\Column\Column::getRealSqlColumn($sqlColumn);

        $method = $aggregator->getMethod();
        $query = $method . '( ' . $sqlColumn . ' )';

        $result = $qBuilder->aggregation($query);

        return $aggregator->getLabelledValue($result);
    }

    public function getCount()
    {
        if (is_null($this->count))
        {
            $qBuilder = $this->getQueryBuilderFeeded();
            $qBuilder = clone($qBuilder);

            $countSql = 'COUNT(*)';

            //TODO verify if it works in all time
            if ($qBuilder->getGroupBy())
            {
                $countSql = 'COUNT(DISTINCT (' . $qBuilder->getGroupBy() . '))';
                $qBuilder->setGroupBy(NULL);
            }

            $this->count = $qBuilder->aggregation($countSql);
        }

        return $this->count;
    }

    public function getData()
    {
        if ($this->data)
        {
            return $this->data;
        }

        $qBuilder = $this->getQueryBuilderFeeded();
        $this->data = $qBuilder->toCollection();

        $this->adjustColumnAlign();

        return $this->data;
    }

    public function adjustColumnAlign()
    {
        $data = $this->getData();
        $firstItem = $data->first();
        $columns = $this->getColumns();

        foreach ($columns as $idx => $column)
        {
            $column instanceof \Component\Grid\Column;
            $value = \DataSource\Grab::getUserValue($column, $firstItem);

            if (\Type\Integer::isNumeric($value) && !$column->getIdentificator())
            {
                $columns[$idx]->setAlign(\Component\Grid\Column::ALIGN_RIGHT);
            }
        }

        $this->setColumns($columns);
    }

    public function getSelectedModelColumns()
    {
        $qBuilder = $this->getQueryBuilder();
        $modelName = $qBuilder->getModelName();
        $columns = $qBuilder->getColumns();
        $result = array();

        foreach ($columns as $columnName)
        {
            $columnName = \Db\Column\Column::getRealColumnName($columnName);
            $column = $modelName::getColumn($columnName);

            if ($column)
            {
                $result[$columnName] = $column;
            }
        }

        return $result;
    }

    public function mountColumns($availableColumns = null)
    {
        $qBuilder = $this->getQueryBuilder();
        $modelName = $qBuilder->getModelName();
        $columns = $qBuilder->getColumns();
        $result = array();

        foreach ($columns as $orignalColumnName)
        {
            //control sql columns with AS
            $columnName = \Db\Column\Column::getRealColumnName($orignalColumnName);
            $columnSql = \Db\Column\Column::getRealSqlColumn($orignalColumnName);
            $columnLabel = self::columnNameToLabel($columnName);

            if (\Type\Text::get($columnName)->endsWith('Description'))
            {
                continue;
            }

            $obj = new \Component\Grid\Column($columnName, $columnLabel, 'alignLeft');
            $obj->setFilter(TRUE)->setSql($columnSql);

            //case it has a model name, vinculate it with the column of model
            if ($modelName)
            {
                $columnModel = $modelName::getColumn($columnName);
                $columnModel instanceof \Db\Column\Column;

                if ($columnModel)
                {
                    $obj = \DataSource\Model::createOneColumn($columnModel);
                }
            }

            //add support for ..Description column
            /* if (\Type\Text::get($columnName)->endsWith('Description'))
              {
              $originalColumnName = str_replace('Description', '', $columnName);

              if (isset($result[$originalColumnName]))
              {
              $result[$originalColumnName]->setRender(false);
              }

              $columnLabel = str_replace('Description', '', $columnLabel);
              $obj->setLabel($columnLabel);
              } */

            $result[$columnName] = $obj;
        }

        $this->setColumns($result);

        return $result;
    }

    public static function columnNameToLabel($columnName)
    {
        $columnLabel = $columnName;
        //remove "id" in the begin
        if (substr($columnName, 0, strlen('id')) == 'id')
        {
            $columnLabel = str_replace('id', '', $columnName);
        }

        //split by uppercase letter
        $split = preg_split('/(?=[A-Z])/', $columnLabel);
        //implode using space
        return ucfirst(implode(' ', $split));
    }

}
