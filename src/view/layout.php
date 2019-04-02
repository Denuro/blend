<?php

namespace View;

use \DataHandle\Server;
use \DataHandle\UserAgent;
use \DataHandle\Request;

/**
 * Default layout class
 */
class Layout extends \DomDocument implements \Countable
{

    /**
     * List of elements, to make easy to find
     *
     * @var array
     */
    protected $elementList;

    /**
     * Construct the layout
     *
     * @param string $layout relative to layout folder
     * @param boolean $setDom set this as default layout
     */
    public function __construct($layout = NULL, $setDom = FALSE)
    {
        parent::__construct('1.0', 'UTF-8');

        if ($setDom)
        {
            \View\View::setDom($this);
        }

        if (isset($layout) && $layout)
        {
            $this->setLayoutFile($layout);
        }
    }

    /**
     * Return the current event
     *
     * @return string
     */
    public function getEvent()
    {
        $event = Request::get('e');

        if (!$event)
        {
            $event = Request::get('q') ? 'listar' : 'oncreate';
        }

        return $event;
    }

    /**
     * Executes the current event
     *
     * @return mixed
     */
    public function callEvent()
    {
        $event = $this->getEvent();

        if (!$event)
        {
            return false;
        }

        //TODO this piece of code need to be in other plase
        //adjust some events to avoid overhead of eventos
        $replace['oncreate'] = 'listar';
        $replace['confirmaExclusao'] = 'remover';
        $replace['salvar'] = 'adicionar';

        $parsed = str_replace(array_keys($replace), array_values($replace), $event);
        $canDo = $this->verifyPermission($parsed);

        if (!$canDo)
        {
            throw new \UserException('Sem permissão para acessar evento <strong>' . ucfirst($event) . '</strong> na página <strong>' . ucfirst($this->getPageUrl()) . '</strong>.');
        }

        //register the event in html, so when get it from js
        $this->byId('content')->data('event', $event);

        if (method_exists($this, $event))
        {
            return $this->$event();
        }
    }

    /**
     * Verify permission to event.
     * By default user has all permission.
     * You need to implement a Acl.
     *
     * @param string $event
     * @return boolean
     */
    public function verifyPermission($event)
    {
        return true;
    }

    /**
     * Called by system when the layout is created.
     * Called when is not ajax
     *
     */
    public function onCreate()
    {

    }

    /**
     * Define the title of layout
     *
     * @param string $title the page title
     *
     * @return \View\Layout
     */
    public function setTitle($title)
    {
        $element = $this->getElementsByTagName('title')->item(0);

        if ($element instanceof \DOMElement)
        {
            $element->nodeValue = $title;
        }

        if (Server::getInstance()->isAjax())
        {
            $title = \View\Script::treatStringToJs($title);
            \App::addJs("document.title = '{$title}';");
        }

        return $this;
    }

    /**
     * Return the page title
     *
     * @return string
     */
    public function getTitle()
    {
        $element = $this->getElementsByTagName('title')->item(0);

        if ($element instanceof \DOMElement)
        {
            return $element->nodeValue;
        }

        return '';
    }

    /**
     * Return the textual content of some layout
     *
     * @param string $layout
     * @return type
     * @throws \Exception
     */
    public function getLayoutContent($layout)
    {
        $htmlFile = filePath($layout, 'html');

        if (file_exists($htmlFile))
        {
            //add suporte a UTF-8
            $content = mb_convert_encoding(file_get_contents($htmlFile), 'HTML-ENTITIES', "UTF-8");

            if (!$content)
            {
                throw new \Exception('Layout vazio em ' . $htmlFile);
            }

            return $content;
        }
        else
        {
            throw new \Exception('Layout não encontrado em ' . $htmlFile);
        }
    }

    /**
     *
     * @param type $content
     * @return type
     */
    protected function parseIncludes($content)
    {
        //localiza includes no layout
        $regExp = "/<include>(.*)<\/include>/iu";
        preg_match_all($regExp, $content, $includes);

        //passa pelos include obtendo conteúdo
        if (is_array($includes[1]) && count($includes[1]) > 0)
        {
            foreach ($includes[1] as $line => $includeString)
            {
                $innerContent = $this->getLayoutContent($includeString);
                $content = str_replace($includes[0][$line], $innerContent, $content);
                $content = $this->parseIncludes($content);
            }
        }

        return $content;
    }

    /**
     * Define um arquivo html padrão para este layout
     *
     * @param string $layout caminho relativo
     */
    public function setLayoutFile($layout)
    {
        $this->loadFromFile($layout);
        $this->setBaseUrl();
    }

    /**
     * Load layout from file
     *
     * @param string $layout
     */
    public function loadFromFile($layout)
    {
        $content = $this->getLayoutContent($layout);
        $content = $this->parseIncludes($content);

        //desabilita erros chatos da libxml na leitura de layouts
        libxml_use_internal_errors(true);
        $this->strictErrorChecking = FALSE;
        $this->loadHTML($content);
        libxml_clear_errors();
    }

    public function loadHTML($source, $options = NULL)
    {
        $encoding = mb_detect_encoding($source, 'UTF-8,ISO-8859-1', true);

        if ($encoding == 'UTF-8')
        {
            $source = utf8_decode($source);
        }

        $ok = @parent::loadHTML($source);

        return $ok;
    }

    /**
     * Adiciona uma planilha de estilos no layout
     *
     * @param string $href
     * @param string $type
     * @param string $media
     */
    function addStyleShet($id, $href, $media = NULL, $addDefaultPath = TRUE)
    {
        $heads = $this->getElementsByTagName('head');
        $head = $heads->item(0);

        if (!$head)
        {
            return $this;
        }

        $defaultPath = '';

        if ($addDefaultPath)
        {
            $defaultPath = APP_PATH . DS;
        }

        $file = new \Disk\File($defaultPath . $href);

        //auto optimize/minimize file if is needed
        if ($file->exists())
        {
            $mTime = $file->getMTime();
            $filePath = str_replace('.css', '', $file->getBasename(TRUE));
            $filePath = $filePath . '_' . $mTime . '.css';

            //$fileOptimize = \Disk\File::getFromStorage($file->getBasename(TRUE));
            $fileOptimize = \Disk\File::getFromStorage($filePath);

            if (!$fileOptimize->exists() || ( $mTime > $fileOptimize->getMTime() ))
            {
                $file->load();

                $fileOptimize->save(\Misc\Css::optimize($file->getContent()));
            }

            //avoid cache
            $href = $fileOptimize->getUrl();
        }

        $stylesheet = new \View\Link($id, $href, 'stylesheet', 'text/css', $media);
        $head->appendChild($stylesheet);

        return $this;
    }

    /**
     * Adiciona um script ao layout
     *
     * TODO make it work with ajax
     *
     * @param string $src utilizado quando o script é externo
     * @param string $content utilizado quando o script é inline
     */
    function addScript($src = NULL, $content = NULL, $type = \View\Script::TYPE_JAVASCRIPT, $id = NULL, $async = FALSE)
    {
        $heads = $this->getElementsByTagName('head');
        $head = $heads->item(0);

        if (!$head)
        {
            return $this;
        }

        if (is_file($src))
        {
            $file = new \Disk\File($src);
        }
        else
        {
            $file = new \Disk\File(APP_PATH . DS . $src);
        }

        //auto optimize/minimize file if is needed
        if ($file->exists())
        {
            $mTime = $file->getMTime();
            $filePath = str_replace('.js', '', $file->getBasename(TRUE));
            $filePath = $filePath . '_' . $mTime . '.js';

            $fileOptimize = \Disk\File::getFromStorage($filePath);

            $src = $fileOptimize->getUrl();

            if (!$fileOptimize->exists() || ( $file->getMTime() > $fileOptimize->getMTime() ))
            {
                $file->load();

                //TODO make js optimize
                $fileOptimize->save($file->getContent());
            }
        }

        $script = new \View\Script($src, $content, $type, $async);
        $script->setId($id);
        $head->appendChild($script);
    }

    /**
     * Adiciona um elemento no elemento atual, caso for um texto cria um textNode.
     * Caso seja um array adiciona um por um.
     *
     * @param string $content
     * @return boolean
     *
     */
    public function append($content)
    {
        if (is_array($content))
        {
            foreach ($content as $info)
            {
                if ($info instanceof \DOMNode)
                {
                    $this->appendChild($info);
                }
                else if (is_string($info))
                {
                    $this->appendChild(new \DOMText($info));
                }
                else if (is_array($info))
                {
                    $this->append($info);
                }
                else
                {
                    throw new \Exception('Não é uma instância DOMNode');
                }
            }

            return true;
        }

        //caso não seja instancia de DomElement, cria um elemento de texto
        if (!$content instanceof \DomElement && !$content instanceof \DOMText && !$content instanceof \DOMDocumentFragment)
        {
            $content = $this->createTextNode($content);
        }

        if ($content)
        {
            return parent::appendChild($content);
        }
    }

    /**
     * Método responsável por renderizar conteúdo de
     * uma string HTML, e não simplesmente joga-la com formato
     * de texto puro.
     *
     * @param string $html
     * @return \DOMDocumentFragment
     */
    public function getHtmlElement($html)
    {
        if ($html && mb_strlen(trim($html)) > 0)
        {
            $fragment = $this->createDocumentFragment();
            @$fragment->appendXML($html);
            return $fragment;
        }

        return $html;
    }

    /**
     * Coloca um layout dentro do outro
     *
     * @param type $primaryElementId
     * @param \View\Layout $domInner
     * @throws \Exception
     */
    public function appendLayout($primaryElementId, \View\Layout $domInner)
    {
        //elemento do layout principal
        $primaryContent = $this->getElementById($primaryElementId);

        if ($primaryContent instanceof \View\DomContainer)
        {
            $primaryContent = $primaryContent->getDomElement();
        }

        //quando o layout for criado via programação acessa o primeiro filho
        $innerContent = $domInner->firstChild;

        //para o caso de ser criado via html
        if ($innerContent instanceof \DOMDocumentType)
        {
            $html = $domInner->childNodes->item(1);
            $body = $html->childNodes->item(0);
            $innerContent = $body->childNodes->item(0);
        }

        //Quando não tiver nenhum conteúdo no layout não importa nada.
        if (!$innerContent)
        {
            return FALSE;
        }

        $innerContentMig = $this->importNode($innerContent, true); //importa o nodo

        if ($primaryContent && $innerContentMig)
        {
            $primaryContent->appendChild($innerContentMig);
        }
        else
        {
            $this->append($innerContentMig);
        }

        if (isset($innerContent->nextSibling))
        {
            $nodeToImport = $innerContent->nextSibling;
        }

        //importa outros nodos
        while (isset($nodeToImport))
        {
            $innerContentMig = $this->importNode($nodeToImport, TRUE);

            if ($primaryContent && $innerContentMig)
            {
                $primaryContent->appendChild($innerContentMig);
            }
            else
            {
                $this->append($innerContentMig);
            }

            $nodeToImport = $nodeToImport->nextSibling;
        }
    }

    /**
     * Return the body element
     *
     * @return \DomElement
     */
    public function getBody()
    {
        $bodys = $this->getElementsByTagName('body');

        return new \View\DomContainer($bodys->item(0));
    }

    /**
     * Add class to navigator in body
     *
     * @return \View\Layout
     */
    public function setBodyDefaultClass()
    {
        $browser = new UserAgent();
        $body = $this->getBody();
        $name = $browser->getName();
        $version = $browser->getSimpleVersion();
        $class = $body->getAttribute('class') . ' ' . $name;

        if ($version)
        {
            $class .= ' ' . $name . '' . $version;
        }

        $body->setAttribute('class', $class);

        return $this;
    }

    /**
     * Define the base url in base element
     * If base not exist it is created
     *
     * @return \View\Layout
     */
    public function setBaseUrl()
    {
        $server = Server::getInstance();
        $bases = $this->getElementsByTagName('base');
        $base = $bases->item(0);

        //if exist
        if ($base)
        {
            $base->setAttribute('href', $server->getHost());

            return $this;
        }

        $base = new \View\Base(NULL, $server->getHost());

        $heads = $this->getElementsByTagName('head');
        $head = $heads->item(0);

        if (is_object($head))
        {
            $head->appendChild($base);
        }

        return $this;
    }

    /**
     * Retorna o DomNode especifico para o id solicitado.
     *
     * Quando usado html 5, em função do PHPDom não conseguir validar o esquema,
     * algumas vezes o id não é encontrado pela função getElementById padrão.
     * Neste caso aplicamos um Xpath para encontrar.
     *
     * @param type $elementId
     * @return \View\View
     */
    public function getElementById($elementId, $class = NULL)
    {
        //without id, no element for you!
        if (!$elementId)
        {
            return NULL;
        }

        //compatibility with jquery
        $elementId = str_replace('#', '', $elementId);

        //add support for formName
        if (stripos($elementId, '[') > 0)
        {
            $elementId = str_replace(array('[', ']'), '', $elementId);
        }

        //tenta o atalho pelo elemento registrado
        if (isset($this->elementList[$elementId]))
        {
            return $this->elementList[$elementId];
        }

        //tenta pela função padrão, as vezes não pega
        $element = parent::getElementById($elementId);

        //caso não encontre pelo getElementById tenta pelo Xpath
        if (!$element)
        {
            $x = new \DOMXPath($this);
            $element = $x->query("//*[@id='{$elementId}']")->item(0);
        }

        //caso não encontre elemento cria um falso para não dar
        //erro e facilitar a programação
        if (!$element instanceof \DOMElement)
        {
            $dataServerClass = Request::get('data-server-class');
            $serverClass = isset($dataServerClass[$elementId]) ? $dataServerClass[$elementId] : NULL;

            $class = $class ? $class : $serverClass;
            $class = $class ? $class : '\View\Div';

            $element = new $class(\View\View::REPLACE_SHARP . $elementId);
            $element->setOutputJs(TRUE);
            //remove do dom para não reaparecer
            $element->parentNode->removeChild($element);
        }

        return $element;
    }

    /**
     * A fast byId but return a \DomElement
     *
     * @param string $elementId
     * @return \DomElement
     */
    public function byIdFast($elementId)
    {
        $x = new \DOMXPath($this);
        return $x->query("//*[@id='{$elementId}']")->item(0);
    }

    /**
     * Alias para getElementBy
     *
     * @param string $id
     * @return \View\View
     */
    public function byId($id, $class = NULL)
    {
        $element = $this->getElementById($id, $class);

        if ($element instanceof \DOMElement && !$element instanceof \View\View)
        {
            $element = new \View\DomContainer($element);
        }

        return $element;
    }

    /**
     * Query dom elements using Css selector
     *
     * @param string $cssSelector
     * @return \DOMNodeList
     */
    public function query($cssSelector)
    {
        $xpath = new \DOMXPath($this);
        $result = $xpath->query(XPathToCss::convert($cssSelector));

        return $result;
    }

    /**
     * Return a seletor jquery
     *
     * @param string $selector
     * @return \View\Selector
     */
    public function jquery($selector)
    {
        return \View\Selector::get($selector);
    }

    /**
     * Adiciona um elemento a lista de elementos.
     * Dessa forma ele pode ser localizado pelo getElementById a qualquer momento
     *
     * @param DomElement $element
     */
    public function addToElementList(\DomElement $element)
    {
        $id = $element->getAttribute('id');
        $this->elementList[$id] = $element;
    }

    /**
     * Return the url of the page
     *
     * @return string
     */
    public function getPageUrl()
    {
        $className = strtolower(get_class($this));
        $useModule = \DataHandle\Config::get('use-module');
        $module = Request::get('m');

        if ($useModule)
        {
            $className = str_replace($module . '\\', '', $className);
            $module .= '/';
        }
        else
        {
            $module = '';
        }

        $moduleSeparator = '-';
        $class = str_replace('\\', $moduleSeparator, $className);
        $url = $module . str_replace(array('Page\\', 'page\\', 'page' . $moduleSeparator, 'Page' . $moduleSeparator), '', $class);

        return $url;
    }

    /**
     * Return string representation of layout.
     * Remove double spaces to otimize to page speed
     *
     * @return string
     */
    public function __toString()
    {
        $this->formatOutput = TRUE;

        return self::optimizeHtml($this->saveHTML());
    }

    /**
     * Optimize html
     * Remove comments and other unnecessary things
     *
     * @param string $html
     * @return string
     */
    public static function optimizeHtml($html)
    {
        //remove comments
        $html = preg_replace('/<!--(?!<!)[^\[>].*?-->/Uis', '', $html);
        //trim all lines
        $html = implode(PHP_EOL, array_map('trim', explode(PHP_EOL, $html)));

        return $html;
    }

    /**
     * Count all elements recursive
     *
     * @return int
     */
    public function count()
    {
        $count = $this->childNodes->length;
        $childNodes = $this->childNodes;

        foreach ($childNodes as $node)
        {
            if (!$node instanceof \View\View && $node instanceof \DOMElement)
            {
                $node = new \View\DomContainer($node);
            }

            $count += count($node);
        }

        return $count;
    }

}
