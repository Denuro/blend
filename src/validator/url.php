<?php
namespace Validator;

/**
 * Url validation (website address)
 */
class Url extends \Validator\Validator
{
    public function validate($value = null)
    {
        $error = parent::validate($value);

        if ( mb_strlen($value) > 0 && !$this->validaUrl($value) )
        {
            $error[ ] = 'Url inválida: '.$value."!";
        }

        return $error;
    }

    protected function validaUrl($value)
    {
        return filter_var($value, FILTER_VALIDATE_URL ) && preg_match('/(http:|https:)\/\/(.*)/', $value);
    }


    /**
     * Add a prefix to url
     *
     * @param $url
     * @param $prefix
     * @return mixed|string
     */
    public static function addPrefix($url, $prefix = 'https://')
    {
        if  ( $ret = parse_url($url) ) {

            if ( !isset($ret["scheme"]) )
            {
                $url = $prefix.$url;
            }
        }

        return $url;
    }

    /**
     * Remove prefix
     * @param $url
     * @return string
     */
    public static function removePrefix($url)
    {
        $prefix = [];
        $prefix[] = 'http://';
        $prefix[] = 'https://';
        $prefix[] = 'ftp://';

        return str_replace($prefix, '', rtrim($url,"/'"));
    }

    /**
     * Similar to validate, but more "open"
     * @param $url
     * @return bool
     */
    public static function isUrl($url)
    {
        $regex = '/(http:\/\/|https:\/\/)?[a-zA-Z][a-z0-9_-]*?[.]?[a-z0-9]*[.](com|net)(\.br)?(\/)?([a-z]*)?/ium';
        preg_match( $regex,$url, $matches);

        if (isset($matches[0]) && $matches[0])
        {
            return true;
        }
        else
        {
            return false;
        }
    }
}
