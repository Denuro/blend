<?php

namespace Filter;

use DataHandle\Request;

/**
 * Description of int
 *
 * @author eduardo
 */
class Integer extends \Filter\Text
{

    const COND_IGUAL = '=';
    const COND_MAIOR = '>';
    const COND_MAIOR_IGUAL = '>=';
    const COND_MENOR = '<';
    const COND_MENOR_IGUAL = '<=';
    const COND_BETWEEN = 'between';

    public function __construct(\Component\Grid\Column $column, $filterName = \NULL, $filterType = NULL)
    {
        parent::__construct($column, $filterName, $filterType);
        $this->setDefaultCondition(self::COND_IGUAL);
    }

    protected function getCondJs($select)
    {
        $select->change("filterChangeInteger($(this));");
        \App::addJs("$('#{$select->getId()}').change();");
    }

    public function getConditionList()
    {
        $options = array();
        $options[self::COND_IGUAL] = 'Igual';
        $options[self::COND_MAIOR] = '>';
        $options[self::COND_MAIOR_IGUAL] = '>=';
        $options[self::COND_MENOR] = '<';
        $options[self::COND_MENOR_IGUAL] = '<=';
        $options[Text::COND_NOT_EQUALS] = '*Diferente';
        $options[self::COND_BETWEEN] = '*Intervalo';
        $options[\Filter\Text::COND_NULL_OR_EMPTY] = 'Nulo ou vazio';

        return $options;
    }

    public function getInputValue($index = 0)
    {
        $columnValue = $this->getValueName();

        $input[0] = new \View\Ext\IntInput($columnValue . '[]', $this->getFilterValue($index), NULL, NULL, 'filterInput');
        $input[0]->onPressEnter("$('#buscar').click()");
        $input[1] = new \View\Ext\IntInput($columnValue . 'Final[]', $this->getFilterValueFinal($index), NULL, NULL, 'filterInput final');
        $input[1]->onPressEnter("$('#buscar').click()");

        return $input;
    }

    public function createWhere($index = 0)
    {
        $cond = null;
        $column = $this->getColumn();
        $columnName = $column->getSql();
        $conditionValue = $this->getConditionValue($index);
        $filterValue = $this->getFilterValue($index);
        $filterFinalValue = $this->getFilterValueFinal($index);
        $conditionType = $index > 0 ? \Db\Cond::COND_OR : \Db\Cond::COND_AND;

        if ($conditionValue && (strlen(trim($filterValue)) > 0))
        {
            if ($conditionValue == self::COND_BETWEEN)
            {
                $conditionType = \Db\Cond::COND_AND;
                $values[] = \Type\Decimal::value($filterValue);
                $values[] = \Type\Decimal::value($filterFinalValue);

                $cond = new \Db\Cond($columnName . ' BETWEEN ? AND ?', $values, $conditionType, $this->getFilterType());
            }
            else if ($conditionValue == self::COND_NULL_OR_EMPTY)
            {
                $cond = new \Db\Cond('(' . $columnName . ' IS NULL OR ' . $columnName . ' = \'\' )', NULL, $conditionType, $this->getFilterType());
            }
            else
            {
                if ($conditionValue == self::COND_NOT_EQUALS)
                {
                    $conditionType = \Db\Cond::COND_AND;
                }

                $filterValue = \Type\Decimal::value($filterValue);
                $cond = new \Db\Where($columnName, $conditionValue, $filterValue, $conditionType, $this->getFilterType());
            }
        }

        return $cond;
    }

}
