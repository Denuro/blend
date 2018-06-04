"use strict";

$.ajaxSetup({
  xhrFields: {
    withCredentials: true
  }
})

/**
 * handle the back and forward buttons
 */
var formChangedAdvice = false;
/**
 * used to open current tab when f5
 */
var hashOriginal = window.location.hash;
var invalidHover = true;
var lastUrl = correctUrl(window.location.href);
var avoidUrlRegister = false;

$(window).bind('popstate', function (event)
{
    var href = window.location.href;
    avoidUrlRegister = true;
    p(href, true);
});

//avoid console.log problems
if (!window.console)
{
    window.console = {};
    window.console.log = function ()
    {
    };
}

//polyfill to old browser
function startsWith(originalString, searchString)
{
    if (typeof searchString == 'undefined')
    {
        return false;
    }
    
    return originalString.substr(0, searchString.length) === searchString;
}

//destroy popup on esc
$(document).keyup(function (e)
{
    if (e.which === 27)
    {
        popup('destroy');
    }
});

/**
 * Loading without ajax
 */
$(document).ready(function ()
{
    dataAjax();

    if ($(hashOriginal + '.item').length == 1)
    {
        setTimeout(function () {
            selectTab(hashOriginal);
        }, 300);
    }

});

/**
 * Parse data-ajax attribute, to make a link ajax
 *
 * @returns boolean always false
 */
function dataAjax()
{
    //links
    $("[data-ajax]").each(function ()
    {
        var element = $(this);
        var dataAjax = element.attr('data-ajax');
        var href = element.attr('href');
        var disabled = element.attr('disabled');
        element.removeAttr('data-ajax');

        if (href && dataAjax)
        {
            if ( disabled == 'disabled')
            {
                element.click(function () 
                {
                    toast('Ação desabilitada!');
                    return false;
                });
            }
            else if (dataAjax === 'noFormData')
            {
                element.click(function () {
                    return g(href, '');
                });
            }
            else
            {
                element.click(function () {
                    return p(href);
                });
            }
        }
    }
    );

    //on press enter
    $("[data-on-press-enter]").each(function ()
    {
        var element = $(this);
        var myEvent = element.attr('data-on-press-enter');

        //get out if converted
        if (element.attr('data-on-press-enter-converted') == "1")
        {
            return;
        }

        //mask as converted
        element.attr('data-on-press-enter-converted', "1");
        element.keydown(
            function (e)
            {
                if (e.keyCode == "13")
                {
                    eval(myEvent);
                    e.preventDefault();
                }
                else
                {
                    return true;
                }
            }
        );
    }
    );

    //remove invalid on change
    $('[data-invalid=1]').change(function () {
        $(this).parent().find('.hint.danger').fadeOut(500, function () {
            $(this).remove();
        });
    });

    //make invalid
    $('[data-invalid=1]').each(function () {
        var element = $(this);
        var title = element.attr('title');
        
        //don't create hint for hidden elements
        if ( !element.is(':visible'))
        {
            return;
        }
        
        if ( invalidHover == true )
        {
            if (title !== undefined)
            {
                element.hover(function ()
                {
                    var position = element.position().left + element.width()
                    var myDiv = $('<div class="hint danger">' + element.attr('title') + '</div>');
                    myDiv.css('left', position);

                    element.parent().append(myDiv);
                },
                        function ()
                        {
                            $(element).parent().find(".hint").remove();
                        });
            }
        }
        else
        {
            var position = element.position().left + element.width()
            var myDiv = $('<div class="hint danger">' + element.attr('title') + '</div>');
            myDiv.css('left', position);

            element.parent().append(myDiv);
        }
    });

    //make masks work
    $("input[data-mask]").each(function () {
        $(this).mask($(this).attr("data-mask"));
    });

    //mask functions
    $("input[data-mask-function]").each(function () {
        var maskVar = window[$(this).attr("data-mask-function")];
        $(this).mask(maskVar, {onKeyPress: function (input, e, currentField, options) {
                  $(currentField).mask(maskVar(input), options);
            }});
    });

    //input float and integer
    if (typeof ($('input.float').autoNumeric) === "function")
    {
        $('input.float').autoNumeric('init');
        //limpa campo quando entrar nele e for zerado
        $('input.float').focus( function(){
         if ($(this).val() == '0,00')   
         {
             $(this).val('');
         }
        });
        
        //limpa campo quando entrar nele e for zerado
        $('input.float').blur( function(){
         if ($(this).val() == '')   
         {
             $(this).val('0,00');
         }
        });
        
        $('input.integer').autoNumeric('init');
    }
    
    if (typeof ($( '.swipebox' ).swipebox) === "function")
    {
        $( '.swipebox' ).swipebox();
    }

    //resolve chrome bug
    $('select[multiple] option').mousemove(function ()
    {
        return false;
    });

    //multi select without ctrl
    $('select[multiple] option').mousedown(function ()
    {
        if ($(this).prop("selected"))
        {
            $(this).prop("selected", false);
        }
        else
        {
            $(this).prop("selected", true);

        }

        return false; //prevent default click
    });

    seletMenuItem();

    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1;
    var isIphone = ua.indexOf("iphone") > -1;
        
    if (isAndroid|| isIphone)
    {
        $('.dateinput').not('[readonly]').each(function () {
            $(this).mask('99/99/9999');
        });
        
        $('.datetimeinput').not('[readonly]').each(function () {
            $(this).mask('99/99/9999 99:99:99');
        });
        
        $('.timeinput').not('[readonly]').each(function () {
            $(this).mask('99:99:99');
        });
    }
    else if (typeof $().datetimepicker === 'function')
    {
        $('.dateinput').not('[readonly]').datetimepicker({
            timepicker: false,
            defaultSelect: false,
            validateOnBlur: false,
            closeOnDateSelect: true,
            mask: true,
            allowBlank: true,
            format: 'd/m/Y',
            step: 15
        });

        $('.datetimeinput').not('[readonly]').datetimepicker({
            format: 'd/m/Y H:i:s',
            mask: true,
            defaultSelect: false,
            validateOnBlur: false,
            closeOnDateSelect: true,
            allowBlank: true,
            step: 15
        });

        $('.timeinput').not('[readonly]').datetimepicker({
            format: 'H:i:s',
            defaultSelect: false,
            datepicker: false,
            validateOnBlur: false,
            closeOnDateSelect: true,
            allowBlank: true,
            mask: true,
            step: 15
        });
    }
    else
    {
        //fallback to default date of browser
        $('.dateinput').each(function () {
            var element = $(this);
            var value = element.val();

            //don't format
            if (value.indexOf('/') > 0)
            {
                var date = value.split('/').reverse().join('-');
                element.val(date);
            }

            element.prop('type', 'date');
        });

        $('.datetimeinput').each(function () {
            var element = $(this);
            var value = element.val();

            //don't format
            if (value.indexOf('T') < 0)
            {
                var datetime = value.split(' ');
                var date = datetime[0].split('/').reverse().join('-');
                element.val(date + 'T' + datetime[1]);
            }

            element.prop('type', 'datetime-local');
        });
    }

    //mark form changed on change
    $('input, select, textarea').on('change', function () {
        markFormChanged();
    });

    //on key press
    $('input, textarea').on('keypress', function () {
        markFormChanged();
    });

    //add support for nick editor, and other contenteditable
    $('*[contenteditable]').on('keypress', function () {
        markFormChanged();
    });

    $('*[data-form-changed-advice]').on('click', function (event)
    {
        if (formChangedAdvice == false && $('#formChanged').val() == 1)
        {
            return showFormChangedAdvice();
        }
    });

    //esconde menu
    /*$('#content').hover(function ( ) 
    {
        $('.subMenu').hide()
    });*/

    //Disable user interaction with select buttons readonly.
    $("select[readonly]").live("focus mousedown mouseup click", function (e) {
        e.preventDefault();
        e.stopPropagation();
    });

    hideLoading();

    return false;
}

/**
 * Mark for as changed
 * @returns false
 */
function markFormChanged()
{
    //mark form as changed
    $('#formChanged').val(1);
    //enable all save button
    $('.save').removeAttr('disabled');
    //disable advice flag
    formChangedAdvice = false;

    return false;
}

function showFormChangedAdvice()
{
    toast('Os dados foram modificados! Tem certeza que quer realizar esta ação?');
    formChangedAdvice = true;

    event.preventDefault();
    //event.stopImmediatePropagation();

    return false;
}

/**
 * Update browser url
 *
 * @param {string} page
 * @returns {void}
 */
function updateUrl(page)
{
    if (window.history.pushState === undefined || page === 'undefined')
    {
        avoidUrlRegister = false;
        return false;
    }
    
    if ( avoidUrlRegister)
    {
        avoidUrlRegister = false;
        return false;
    }
    
    var urlToRegister = correctUrl(page) ;

    if ( urlToRegister != lastUrl)
    { 
        window.history.pushState({url: urlToRegister}, "", urlToRegister);
        lastUrl = urlToRegister;
        avoidUrlRegister = false;
        return true;
    }
    
    avoidUrlRegister = false;
    return false;
}

function correctUrl(url)
{
    var base = $('base').attr('href');
    
    //make full url
    if ( !startsWith(url,base))
    {
        url = base + url;
    }
    
    //remove # and after from end
    url = url.split('#')[0]
    
    //remove ? in end
    if ( url.substr(-1, 1) === '?')
    {
        url = url.substr(0, url.length -1 );
    }
    
    return url;
}

/**
 * Page Post
 *
 * @param {String} page
 * @param {String} formData
 * @returns {Boolean}
 */
function p(page, formData)
{
    return r("POST", page, formData);
}

/**
 * Page get
 *
 * @param {String} page
 * @param {String} formData
 * @returns {Boolean}
 */
function g(page, formData)
{
    return r("GET", page, formData);
}

/**
 * Make a event to current page
 *
 * @param {string} event
 * @param {mixed} formData
 * @returns {boolean}
 */
function e(event, formData)
{
    return p(getCurrentPage() + '/' + event, formData);
}

/**
 * http://abandon.ie/notebook/simple-file-uploads-using-jquery-ajax
 *
 * @deprecated since 25/09/2014
 *
 * @param {string} page saasd
 * @returns boolean false
 */
function fileUpload(page)
{
    var data = new FormData();

    // Adiciona todos arquivos selecionados no campo
    jQuery.each($('input[type=file]'), function (i, element)
    {
        var files = $(element).prop('files');

        for (var x = 0; x < files.length; x++)
        {
            data.append('file-' + i + x, files[x]);
        }
    });

    // Adiciona demais campos do formulário
    $('input, select').each(function ()
    {
        data.append(this.name, this.value);
    });

    return r("POST", page, data);
}

var avoidTab = function()
{
    var keyCode = event.keyCode || event.which; 

    if (keyCode == 9) 
    { 
        event.preventDefault(); 
    } 
}

function showLoading()
{
    $( "body" ).bind( "keydown", avoidTab );
    $(".loading").fadeIn('fast');
}

function hideLoading()
{
    $( "body" ).unbind( "keydown", avoidTab );
    $(".loading").fadeOut('fast');
}

/**
 *
 * Make a ajax to a page
 *
 * @param {string} type
 * @param {string} page
 * @param {string} formData
 * @returns {Boolean} Boolean always return fase, so it can be use in buttons and onclicks
 */
function r(type, page, formData)
{
    var focused = $(':focus');

    if (focused.data('form-changed-advice') == 1 && $('#formChanged').val() == 1)
    {
        if (formChangedAdvice == false)
        {
            focused.removeAttr('disabled');
            return showFormChangedAdvice();
        }
    }

    //disable focused element, perhaphs a button or link
    if (typeof focused.get(0) != 'undefined')
    {
        if (focused.get(0).tagName == 'a' || focused.get(0).tagName == 'button')
        {
            focused.attr('disabled', true);
        }
    }

    showLoading();
    updateEditors();

    var host = $('base').attr('href');
    var url = host + page.replace(host, '');

    //default jquery value https://api.jquery.com/jQuery.ajax/
    var contentType = 'application/x-www-form-urlencoded; charset=UTF-8';

    if (typeof formData === 'undefined')
    {
        if ($('input[type=file]').length > 0)
        {
            contentType = false;
            var formData = new FormData();

            // Adiciona todos arquivos selecionados no campo
            jQuery.each($('input[type=file]'), function (i, element)
            {
                var files = $(element).prop('files');
                formData.append('file-' + i, files[0]);
            });

            // Adiciona demais campos do formulário
            $('input, select, textarea').each(function ()
            {
                formData.append(this.name, this.value);
            });

            //control uncked checkbox
            $("input:checkbox:not(:checked)").each(function ()
            {
                formData.append(this.name, '0');
            });

            //minnor support for multiple values
            $("select[multiple]").each(function () {
                var el = $(this);
                var id = el.attr('id').replace('[', '\\[').replace(']', '\\]');
                var name = el.attr('name').replace('[', '').replace(']', '');

                var value = Array();

                $("#" + id + " :selected").map(function (i, el) {
                    value[i] = $(el).val();
                });

                formData.append(name, value);
            });
        }
        else
        {
            formData = $('form').serialize();

            //add server class to post
            $('[data-server-class]').each(
                function () {
                    formData += '&data-server-class[' + $(this).attr('id') + ']=' + $(this).data('server-class');
                }
            )

        }
    }
    else
    {
        if (formData instanceof FormData)
        {
            contentType = false;
        }
        else if ( typeof formData == 'object' )
        {
            formData =$.param(formData);
        }
    }

    $.ajax({
        type: type,
        url: url,
        data: formData,
        cache: false,
        dataType: "json",
        contentType: contentType,
        processData: false,
        xhrFields: {
          withCredentials: true //make cookie work on ajax
        },
        success: function (data)
        {
            //enable the focused element
            focused.removeAttr('disabled');

            if (!data)
            {
                toast('Sem retorno do servidor!', 'danger');
                hideLoading();
                return;
            }

            //only make response if content exists, to avoid clean
            if (data.content !== '')
            {
                if (data.responseType === 'append')
                {
                    $('#' + data.response).append(data.content);
                }
                else
                {
                    $('#' + data.response).html(data.content);
                }
            }

            //try to get page from data.pushsate
            if (typeof data.pushState !== undefined && data.pushState !== null)
            {
                if (data.pushState.length > 0)
                {
                    page = data.pushState;
                }
            }

            //if is GET get page from url+ formdata
            if (type === 'GET')
            {
                page = url + '/?' + formData;
            }

            updateUrl(page);
            //put the js inside body element, to execute
            data.script.replace('\\\"','\\"');
            $('body').append('<script>' + data.script + '</script>');
            //treat js especials
            dataAjax();
        }
        ,
        error: function (xhr, ajaxOptions, thrownError)
        {
            hideLoading();
            
            if (xhr.responseText === '')
            {
                toast('Sem resposta do servidor! Verifique sua conexão!', 'alert');
            }
            else
            {
                focused.removeAttr('disabled');
                toast(xhr.responseText);
                dataAjax();
            }
        }
    });

    return false;
}

function getJson(page,formData, showLoading, callBack)
{
    var host = $('base').attr('href');
    var url = host + page.replace(host, '');    
    
    if (showLoading)
    {
        showLoading();
    }

    $.ajax({
        dataType: "json",
        method: "POST",
        url: url,
        async: true,
        timeout: 20000,
        data: formData,
        xhrFields: {
          withCredentials: true //make cookie work on ajax
        },
        success: function(response)
        {
            if ( typeof response.script == 'string')
			{
				response.script.replace('\\\"','\\"');
				$('body').append('<script>' + response.script + '</script>');
			}
			else
			{
				callBack(response);
			}
        }
        ,error: function (xhr, ajaxOptions, thrownError)
        {
            hideLoading();
            
            if (xhr.responseText === '')
            {
                toast('Sem resposta do servidor! Verifique sua conexão!', 'alert');
            }
            else
            {
                toast('Impossível ler JSON!');
            }
        }
    });
}

function getSelected(selector)
{
    var result = $(selector).map(function (i, el) {
        return $(el).val();
    });

    return
}

/**
 * Return current page
 * @returns {string}
 */
function getCurrentPage()
{
    var relativeUrl = window.location.pathname.replace($('base').attr('href').replace(window.location.protocol + '//' + window.location.host, ''), '');
    return relativeUrl.split('/')[0];
}

/**
 * Return current event
 * @returns {string}
 */
function getCurrentEvent()
{
    var relativeUrl = window.location.pathname.replace($('base').attr('href').replace(window.location.protocol + '//' + window.location.host, ''), '');
    return relativeUrl.split('/')[1];
}

/**
 * Remove all invalid information, and make it if necessary.
 * @returns boolean false
 */
function removeDataInvalid()
{
    $('[data-invalid=1]').removeAttr('title').unbind('hover').removeAttr('data-invalid');
    $('.hint.danger').remove();

    return false;
}

/**
 * Make a simple toast, cool not?
 *
 * @param msg message to show in toast.
 * @param type additional css class.
 * @param duration int.
 * @returns Boolean false.
 */
function toast(msg, type, duration) {
    duration = duration === undefined ? 3000 : duration;
    $("<div class='toast " + type + "'>" + msg + "<strong style=\"float:right;cursor:pointer;\" onclick=\"$(this).parent().remove();\">X</strong></div>")
            .appendTo('body')
            .animate({top: 50, opacity: 1}, 500)
            .delay(1500)
            .fadeOut(duration, function () {
                $(this).remove();
            });

    return false;
}

/**
 * Control all popup behavior.
 *
 * @param action (show, opem, close, destroy).
 * @param selector popups id.
 * @returns Boolean false.
 */
function popup(action, selector)
{
    if (selector + "" === 'undefined')
    {
        selector = '';
    }

    var element = $('.popup' + selector);

    if (action === 'show' || action === 'open')
    {
        $('.makePopupFade').addClass('popupFaded');

        element.fadeIn(600);
    }
    else if (action === 'close')
    {
        $('.makePopupFade').removeClass('popupFaded');

        element.find('.inner').animate({
            opacity: 0,
            width: 0,
            minWidth: 0,
            height: 0,
        }, 500, function () {
            element.hide();
            //restore style
            $('.inner').removeAttr('style');
        });
    }
    else if (action === 'destroy')
    {
        $('.makePopupFade').removeClass('popupFaded');

        //coll animantion
        element.find('.inner').animate({
            opacity: 0,
            width: 0,
            minWidth: 0,
            height: 0,
        }, 300, function () {
            element.remove();
        });
    }
    else if (action === 'maximize')
    {
        element.find('.inner')
                .css('position', 'fixed')
                .css('left', '50%')
                .css('marginLeft', ($('.inner').width() / 2) * -1);

        element.find('.inner').animate({
            top: 0,
            left: 0,
            margin: 0,
            width: "100%",
            height: "100%",
        }, 500, function () {
            element.find('.body').addClass('maximized');
        });
    }

    return false;
}

/**
 * Mostra e esconde o campo de filtro avançado para escolha da data final quando o filtro de data for between.
 *
 * FIXME função 'importada', precisa ser repensada
 *
 * @param {type} show
 * @param {type} id
 * @returns {undefined}
 */
function showEndDate(show, id)
{
    var toRemove = 'Condition';
    var prefixo = id.replace(toRemove, '');

    var mascara = ( ( show === 2 ) ? '99/99' : '99/99/9999' );

    if (show === 1 || show === 2)
    {
        $('#' + prefixo + 'Value').show().mask(mascara);
        
        $('#' + prefixo + 'ValueFinal').show().mask(mascara);
        $('#' + prefixo + 'ValueLabelFinal').show();
    }
    else
    {
        $('#' + prefixo + 'Value').show().mask(mascara);
        
        $('#' + prefixo + 'ValueLabelFinal').hide();
        $('#' + prefixo + 'ValueFinal').hide();
        $('#' + prefixo + 'ValueFinal').value = '';
    }
}

/**
 * Atualiza o conteúdo dos editores html nicEditor
 *
 * @returns void
 */
function updateEditors()
{
    var editor ;
    
    if (typeof nicEditors !== 'undefined' && typeof nicEditors.editors[0] !== 'undefined' && typeof nicEditors.editors[0].nicInstances !== 'undefined')
    {
        for (var i = 0; i < nicEditors.editors[0].nicInstances.length; i++)
        {
            editor = $(nicEditors.editors[0].nicInstances[i].e);
            editor.html(nicEditors.editors[0].nicInstances[i].getContent());
        }
    }

    $('textarea').each(function ()
    {
        if (typeof (nicEditors) !== 'undefined')
        {
            var editor = nicEditors.findEditor($(this).attr('id'));

            if (editor !== undefined && editor !== null)
            {
                $(this).html(editor.getContent());
            }
        }
    });
}

function comboShowDropdown(id)
{
    var element = $('#dropDownContainer_' + id);

    if (element.is('[readonly]'))
    {
        comboHideDropdown(id);
        return false;
    }

    //mininum width
    element.css('min-width', $('#labelField_' + id).width() + 'px');
    //show
    element.fadeIn('fast');
}

function comboHideDropdown(id)
{
    $('#dropDownContainer_' + id).fadeOut('fast');
}

function comboDoSearch(id)
{
    eval($('#labelField_' + id).data('change'));
}

function comboSelectItem(id, value, label, eThis)
{
    $(eThis).parent().find('tr').removeClass('selected');
    $(eThis).addClass('selected');
    var element = $('#' + id);
    element.val(value);
    element.trigger('change');

    var elementLabel = $('#labelField_' + id);
    elementLabel.val(label);
}

var timerTypeWatch = 0;

/*Inspect type in some input*/

function comboTypeWatch(element, event, callback, ms)
{
    var parente = $(element).parent();
    var id = parente.find('.inputValue').attr('id');

    if ($('#labelField_' + id).is('[readonly]'))
    {
        return false;
    }
    
    //TAB, is called when enter input, will make work normally, and clear timeout
    if ( event.keyCode == 9)
    {
        clearTimeout(timerTypeWatch);
        return true;
    }

    //up
    if (event.keyCode === 40)
    {
        comboShowDropdown(id);

        if (parente.find('table tr.selected').length === 0)
        {
            parente.find('table tr').eq(0).click();
        }
        else
        {
            parente.find('table tr.selected').next().click();
        }

        return false;
    }
    //down
    else if (event.keyCode === 38)
    {
        comboShowDropdown(id);

        parente.find('table tr.selected').prev().click();

        return false;
    }
    //enter
    else if (event.keyCode === 13)
    {
        comboHideDropdown(id);

        return false;
    }
    else
    {
        clearTimeout(timerTypeWatch);
        timerTypeWatch = setTimeout(callback, ms);
    }
}

/**
 * Bind var func execution on key press.
 *
 * @param {string} key Example : 'F5','Ctrl+Alt+S'
 * @param {function} func function() { alert('this is my function !'); }
 * @returns bool
 */
function addShortcut(key, func)
{
    if (typeof shortcut !== 'undefined')
    {
        return shortcut.add(key, func);
    }

    return false;
}

/**
 * Unbind function execution on key press.
 * @param {string} key
 * @returns Boolean
 */
function removeShortcut(key)
{
    if (typeof shortcut !== 'undefined')
    {
        return shortcut.remove(key);
    }

    return false;
}

/**
 * Máscara de CPF/CNPJ
 *
 * @param {DomElement} input
 * @param {Event} e
 * @param {DomElement} currentField
 * @param {string} options
 * @returns {String}
 */
var maskCNPJCPF = function (input, e, currentField, options)
{
    //tira os caracters estranhos para fazer funcionar a contagm
    var str = input.replace(/[\.\-]/g, '');

    if (str.length > 11)
    {
        return '99.999.999/9999-99';
    }
    else if (str.length > 8)
    {
        return '999.999.999-999999';
    }
    else
    {
        return '999999999999999999';
    }
};

var maskDateTime = function (input, e, currentField, options)
{
    if (input.length > 9)
    {
        return '99/99/9999 99:99:99';
    }
    else
    {
        return '99/99/9999';
    }
};

var maskSimpleFone = function(e,r,n,t)
{
    var str=e.replace(/[\.\-]/g,"");
    
    return str.length>12?"(99)99999-9999":"(99)9999-99999";
};


/**
 * Set focus on first field.
 * Supports popup;
 *
 * @returns false;
 */
function setFocusOnFirstField()
{
    //support popup
    if ($('.popup').length)
    {
        $('.popup').find('input:not([readonly]):not([disabled]):first').focus();
    }
    else
    {
        $('input:not([readonly]):not([disabled]):first').focus();
    }

    return false;
}


function seletMenuItem()
{
    var currentPage = getCurrentPage();
    //remove class seleted from all items from menu
    $('nav *').removeClass('selected');

    //seleted class in current url
    $('nav *[href=\'' + currentPage + '\']').addClass('selected');
    //seleted class in current url if is a submenu
    $('[href=\'' + currentPage + '\']').parents('li').addClass('selected');

    //hide all sub menu
    $('.subMenu *').click(function () {
        $('.subMenu').hide();
    });
}

/**
 * Add support to play method in jquery
 *
 * @returns {jQuery.fn@call;each}
 */
jQuery.fn.play = function () {
    return this.each(function () {

        if (typeof this.play === 'function')
        {
            this.play();
        }
    });
};

function selectTab(tabItemId)
{
    tabItemId = tabItemId.replace('#', '');
    var tab = $('#' + tabItemId).parents('.tab').eq(0);

    //atualiza url
    updateUrl(window.location.href.replace(window.location.hash, '') + '#' + tabItemId);

    //body
    tab.find('.tabBody>.item').hide();
    tab.find('.tabBody #' + tabItemId).show();

    //head
    tab.find('.tabHead>.item').removeClass('selected');
    tab.find('.tabHead #' + tabItemId + 'Label').addClass('selected');

    return false;
}

function openSubMenu(element)
{
    element =$(element);
    //esconde todos menus
    //submenu atual
    var submenu = element.parent().children('div');
    //console.log(submenu);
    
    console.log(submenu.attr('id'),submenu.css('display'));
    
    if (submenu.css('display') == 'block')
    {
        console.log('a');
        submenu.stop().slideUp('fast');
    }
    else
    {
        console.log('b');
        submenu.stop().slideDown('fast');
    }
    
    return false;
}

function cropCanvas(imgSrc, aspectRatio)
{
    $('#crop-image-handler').attr('src', imgSrc);
    $('#imageHandlerHref').val(imgSrc);
    
    jQuery(function ($) {
        // Create variables (in this scope) to hold the API and image size
        var jcrop_api,
                boundx,
                boundy;
                
        $('#crop-image-handler').Jcrop({
            onChange: updatePreview,
            onSelect: updatePreview,
            aspectRatio: aspectRatio,
            boxWidth: 400,
            //boxHeight: 300,
            setSelect: [0, 0, 1920, 300]

        }, function () {
            // Use the API to get the real image size
            var bounds = this.getBounds();
            boundx = bounds[0];
            boundy = bounds[1];
            // Store the API in the jcrop_api variable
            jcrop_api = this;
            $('#crop-image-handler').data('jcrop_api', jcrop_api);
        });
        function updatePreview(c)
        {
            if (parseInt(c.w) > 0)
            {
                $('#x').val(c.x);
                $('#y').val(c.y);
                $('#w').val(c.w);
                $('#h').val(c.h);
            }
        }
        ;
    });

    $('#crop-canvas').addClass('is-visible');
}

 function destroyCropCanvas() {
    $('#crop-canvas').removeClass('is-visible');
    var jcropApi = $('#crop-image-handler').data('jcrop_api');
    jcropApi.destroy();
    
    return false;
}

function toolTip(selector, message)
{
    var element = $(selector);
    element.attr('title','');
    //var parent = element.parent();
    //element.append('body');
    var toolTipHolder = $(document.createElement('div'));
    toolTipHolder.addClass('tooltip');
    //toolTipHolder.append(element);
    toolTipHolder.append('<span class="tooltiptext">'+message+'</span>');
    element.after(toolTipHolder);
    toolTipHolder.prepend(element);
}

function addScriptOnce(src, callBack)
{
    var list = document.getElementsByTagName('script');
    var i = list.length, flag = false;
    var flag = false;
    
    while (i--)
    {
        if (list[i].src === src) 
        {
            flag = true;
            break;
        }
    }

    // if we didn't already find it on the page, add it
    if (!flag)
    {
        var script = document.createElement('script');
        script.src = src;
        script.onload = callBack;
        document.getElementsByTagName('body')[0].appendChild(script);
    }
    else
    {
        callBack();
    }
}

/**
 * Send focus to next element, work great with on-press-enter
 * @returns {undefined}
 */
function focusNextElement()
{
    var element = document.activeElement;
    
    if (element)
    {
        var inputs = $(':input:visible, select:visible, a:visible').not('[tabindex=-1]').not('[disabled]').not('[readonly]');
        var next = inputs.eq( inputs.index(element)+ 1 );
        next.focus();
    }
}

function toNumber(number)
{
    if (typeof number == "undefined" || number == '')
    {
        number = '0';
    }

    if (typeof number === 'string')
    {
        number = number + "";

        if (number.indexOf(",") > 0)
        {
            number = number.replace(".", "");
            number = number.replace(",", ".");
        }

        number = onlyNumbersAndPoint(number);
    }

    return Number(number);
}


function onlyNumbersAndPoint(num)
{
    if (typeof num == "number")
    {
        return num;
    }

    return num.replace(/[^0-9.\-]/gi, '');
}

//adiciona método contains no array
function arrayContains(array, obj) 
{
    var i = array.length;
    
    while (i--)
    {
        if (array[i] == obj)
        {
           return true;
        }
    }
    
    return false;
}


function preparaVer()
{
    //remove botão de adicionar
    $('#btnInsert').remove();
    //remove filtros
    $('#savedListGroup').remove();
    //adiciona botão de voltar
    $('#btnGroup').append('<button id=\"btnVoltar\" class=\"btn\" onclick=\"history.back(1);\" type=\"button\" title=\"Volta para a listagem!\" data-form-changed-advice=\"1\"><i class=\"fa fa-arrow-left\"></i><span class=\"btn-label\"> Voltar</span></button>');

    //coloca todos campos como readonly e disabled
    $('input, select, textarea').each(
    function()
    {
        $(this).attr('disabled', 'disabled');
        //$(this).attr('readonly', 'readonly');
    }

    );
}