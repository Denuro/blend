
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

var maskSimpleFone = function (e, r, n, t)
{
    var str = e.replace(/[\.\-]/g, "");
    var ss = str.replace(/\D/g, '');
    
    var mask = str.length > 12 ? "(99)99999-9999" : "(99)9999-99999";
    mask = (ss[0] == 0) ? '9999-999-9999' : mask;
    
    return mask;
};


function applyAllMasks()
{
    $("input[data-mask]").each(function () {
        $(this).mask($(this).attr("data-mask"));
    });

    //mask functions
    $("input[data-mask-function]").each(function () 
    {
        var maskVar = window[$(this).attr("data-mask-function")];
        
        $(this).mask(maskVar, {onKeyPress: function (input, e, currentField, options) 
        {
            $(currentField).mask(maskVar(input), options);
        }});
    });
}