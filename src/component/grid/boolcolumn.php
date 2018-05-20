<?php

namespace Component\Grid;

/**
 * Smart date column
 */
class BoolColumn extends \Component\Grid\EditColumn
{

    public function getValue($item, $line = NULL, \View\View $tr = NULL, \View\View $td = NULL)
    {
        $value = \Component\Grid\Column::getColumnValue($this, $item, $line) . '';

        $this->makeEditable($item, $line, $tr, $td);

        if (!$value)
        {
            $value = new \View\I(NULL, '', 'fa fa-square-o');
            $value->setTitle('Não');
        }
        else
        {
            $value = new \View\I(NULL, '', 'fa fa-check-square-o');
            $value->setTitle('Sim');
        }

        return $value;
    }

}