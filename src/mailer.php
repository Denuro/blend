<?php

use DataHandle\Config;

class Mailer extends \PhpMailer
{

    public function __construct()
    {
        parent::__construct();

        $emailHost = Config::get('emailHost');
        $emailPort = Config::get('emailPort');
        $emailUser = Config::get('emailUser');
        $emailPass = Config::get('emailPass');
        $emailFrom = Config::get('emailFrom');
        $emailProtocol = Config::get('emailProtocol');

        $this->configSmtp($emailHost, $emailPort, $emailUser, $emailPass, $emailProtocol);

        if ($emailFrom)
        {
            $this->SetFrom($emailUser, $emailFrom);
        }
    }

    /**
     * Define que o item a ser anexado será uma imagem inline.
     */
    const ATTACHMENT_TYPE_IMAGE = 0;

    /**
     * Define que o item a ser anexado será um arquivo.
     */
    const ATTACHMENT_TYPE_FILE = 1;

    protected function parseImages()
    {
        return $this->parseAttachment('/src="([^"]*)"/ui', self::ATTACHMENT_TYPE_IMAGE);
    }

    protected function parseFiles()
    {
        return $this->parseAttachment('/href="([^"]*)"/ui', self::ATTACHMENT_TYPE_FILE);
    }

    public function parseAttachs()
    {
        $this->parseImages();
        $this->parseFiles();
    }

    public function parseBeforeSend()
    {
        $host = \DataHandle\Server::getInstance()->getHost();
        //não anexa html e php
        $notAttachExts = array('', 'html', 'php', 'png', 'gif', 'bmp', 'jpg', 'jpeg');

        //obtem os caminhos das imagens.
        $srcs = array();
        preg_match_all('/src="([^"]*)"/ui', $this->Body, $srcs);
        $images = $srcs[1];

        foreach ($images as $image)
        {
            $relative = $link = str_replace($host, '', $image);
            $cid = basename($relative);
            $path = APP_PATH . '/' . $relative;

            if (file_exists($path))
            {
                $this->Body = str_replace($image, 'cid:' . $cid, $this->Body);
                $this->AddEmbeddedImage($path, $cid, $cid);
            }
        }

        //obtem os caminhos dos links.
        $hrefs = array();
        preg_match_all('/href="([^"]*)"/ui', $this->Body, $hrefs);
        $links = $hrefs[1];

        foreach ($links as $link)
        {
            //caso seja um link do servidor
            if (stripos($link, $host) == 0)
            {
                //obtem extensão
                $ext = explode('.', $link);
                $ext = strtolower($ext[count($ext) - 1]);

                if (in_array($ext, $notAttachExts))
                {
                    continue;
                }

                $relative = str_replace($host, '', $link);
                $cid = basename($relative);
                $path = APP_PATH . '/' . $relative;

                //verifica se o arquivo existe e se não está na lista de não atachar
                if (file_exists($path))
                {
                    //obtem nome do arquivo sem a extensão.
                    $nomeArquivo = explode('.', basename($link));
                    $nome = $nomeArquivo[0];
                    //padrão para fechar com o elemento A que contenha o link para o arquivo
                    $expressao = '/<a .*?href=.*?' . preg_quote($nome) . '.*?a>/';
                    $this->Body = preg_replace($expressao, '', $this->Body);
                    $this->AddAttachment($path, $cid);
                }
            }
        }
    }

    /**
     * Lê html de arquivos e imagens, se URL deles tiver o host na frente
     * então parseia.
     * E anexa o arquivo.
     * //TODO precisa ser removido
     *
     * @param string $pattern
     * @param int $type
     */
    protected function parseAttachment($pattern, $type = self::ATTACHMENT_TYPE_FILE)
    {
        $hrefs = array();
        //Obtem os caminhos das imagens.
        preg_match_all($pattern, $this->Body, $hrefs);
        $links = $hrefs[1];

        foreach ($links as $link)
        {
            $dest = new \Disk\Media($link);

            if (!$dest->exists())
            {
                $link = str_replace(\DataHandle\Server::getInstance()->getHost(), '', $link);
                $dest = new \Disk\File($link);
            }

            $cid = basename($link);

            if ($type == self::ATTACHMENT_TYPE_FILE)
            {
                $ext = explode('.', $link);
                $ext = $ext[count($ext) - 1];

                if (strlen($ext) > 4)
                {
                    $ext = '';
                }

                //não anexa html e php
                $notAttachExts = array('', 'html', 'php');

                //Se $link começar com a urlbase do servidor, retira-o da mensagem e só deixa o anexo.
                if ($dest->exists() && !in_array($ext, $notAttachExts))
                {
                    //obtem nome do arquivo sem a extensão.
                    $nomeArquivo = explode('.', basename($link));
                    //Padrão para fechar com o elemento A que contenha o link para o arquivo
                    $expressao = '/<a .*?href=.*?' . preg_quote($nomeArquivo[0]) . '.*?a>/';
                    $this->Body = preg_replace($expressao, '', $this->Body);
                    $this->AddAttachment($dest, $cid);
                }
                /* else
                  {
                  $nomeArquivo = explode( '.', basename( $link ) );
                  //Padrão para fechar com o elemento A que contenha o link para o arquivo
                  $expressao = '/<a .*?href=.*?' . preg_quote( $nomeArquivo[ 0 ] ) . '.*?a>/';
                  $newLink = '<a href="' . $this->getReadLink() . '&redirect=' . $link . '" >' . $link . '</a>';
                  $this->Body = preg_replace( $expressao, $newLink, $this->Body );
                  } */
            }
            else
            {
                $myLink = new Type\Text($link);
                $host = \DataHandle\Server::getInstance()->getHost();

                if ($myLink->beginsWith($host))
                {
                    $this->replaceBody($link, 'cid:' . $cid);
                    $this->AddEmbeddedImage($dest, $cid, $cid);
                }
            }
        }
    }

    /**
     * Executa a tradução de uma tag em um conteúdo.
     *
     * @param type $tag (A tag que irá ser interpretada)
     * @param type $conteudo (O conteúdo que deverá ir no lugar da $tag)
     */
    protected function replaceBody($tag, $conteudo)
    {
        //$this->Subject = str_replace( $tag, $conteudo, $this->Subject );
        $this->Body = str_replace($tag, $conteudo, $this->Body);
    }

    public function addImgReader($link)
    {
        $this->Body .= '<img src="' . $link . '" alt="mail logo" height="1" width="1" />';
    }

    public function Send()
    {
        $emailTest = \DataHandle\Config::get('emailTest');

        if ($emailTest)
        {
            $this->ClearAllRecipients();

            $this->addAddress($emailTest);
        }

        return parent::Send();
    }

}
