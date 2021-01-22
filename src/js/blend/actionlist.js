
var actionList = {};

actionList.toggle = function()
{
    if ( $('body').hasClass('action-list-open'))
    {
        actionList.close();
    }
    else
    {
        actionList.open();
    }
};

actionList.restore = function()
{
    if ( $('.action-list-toogle').is(':visible') && !isCellPhone() )
    {
        var wasOpen = localStorage.getItem('action-list-open') == 1;
    
        if ( wasOpen )
        {
            actionList.open();
        }
        else
        {
            actionList.close();
        }
    }
    else
    {
        $('body').removeClass('action-list-open');
    }
};

actionList.open = function()
{
    $('body').addClass('action-list-open');
    localStorage.setItem('action-list-open', 1);
};

actionList.close = function()
{
    $('body').removeClass('action-list-open');
    localStorage.setItem('action-list-open', 0);
    
    return false;
};