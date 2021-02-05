

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
    $('.subMenu *').click(function () 
    {
        $('.subMenu').hide();
    });
}

/**
 * Open/close main menu
 * 
 * @returns {Boolean}
 */
function menuToggle()
{
    $('body').toggleClass('menu-open');

    return false;
}

/**
 * Close the main menu
 * 
 * @returns {Boolean}
 */
function menuOpen()
{
    menuSearch(''); 
    $('body').addClass('menu-open');
    setTimeout(function(){$('#main-menu-search').focus();}, 200);
    
    return false;
}

/**
 * Close the main menu
 * 
 * @returns {Boolean}
 */
function menuClose()
{
    $('body').removeClass('menu-open');

    return false;
}

function openSubMenu(element)
{
    menuCloseAll();
    element = $(element);
    
    //submenu atual
    var submenu = element.parent().children('div');

    if (submenu.css('display') == 'block')
    {
        submenu.stop().slideUp('fast');
    } 
    else
    {
        submenu.stop().slideDown('fast');
    }

    return false;
}

function menuCloseAll()
{
    $('.subMenu').stop().slideUp('fast');
}

function menuSearch(term)
{
    term = toAscii(term.toLocaleLowerCase())+"";
    
    if (term == '')
    {
        $('.main-menu a').show();
        $('.subMenu').hide();
        $('.menu-submenu-header').show();
        return;
    }
    
    //open all menus
    $('.subMenu').show();
    //hide all header
    $('.menu-submenu-header').hide();
    
    $('.main-menu a').each( function()
    {
        var element = $(this);
        var text = toAscii( element.text().toLocaleLowerCase())+"";
        
        var find = text.indexOf(term) >= 0;
        
        if ( find)
        {
            element.show();
        }
        else
        {
            element.hide();
        }
        
    });
}


function floatingMenuToggle()
{
    var focused = $(document.activeElement);
     
    if (focused.hasClass('advanced-filter-menu-group'))
    {
        var idGroup = focused.attr('id');
        
        $('[data-item-group='+idGroup+']').toggle('fast');
     }
    else
    {

        $('#fm-filters').toggle('fast');
    }
}