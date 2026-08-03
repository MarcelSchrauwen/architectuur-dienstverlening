function setRootPanelHeight() {
    $('.root-panel-body').css(
        'height',
        $('.root-panel').outerHeight() - $('.root-panel-heading').outerHeight()
    );
}

// Custom
function fixTreeScroll() {
    setRootPanelHeight(); // hoogte opnieuw berekenen
}


// Custom: Alphabetical sorting
function strcmp(a, b) {
    var aText = $(a).text().trim().toLowerCase();
    var bText = $(b).text().trim().toLowerCase();

    return aText.localeCompare(
        bText,
        undefined,
        {
            numeric: true,
            sensitivity: 'base'
        }
    );
}

function toggleTreeEntry(listItem) {
    // Sort folder content (done here only once for performance reasons)
    if (!$(listItem).hasClass('sorted')) {
        $(listItem).find(' > ul').each(function () {
            // Sort folders first
            $(this).children('li.tree-folder').sort(strcmp).appendTo($(this));
            // Sort views after
            $(this).children('li.tree-element').sort(strcmp).appendTo($(this));
        });
        $(listItem).addClass('sorted');
    }

    if (isTreeFiltered()) {
        return;
    } else {
        var children = $(listItem).find(' > ul > li');
        if (children.is(":visible")) {
            children.hide('fast');
            // Toggle arrow icon
            $(listItem).find('> span > i')
                .addClass('glyphicon-triangle-right')
                .removeClass('glyphicon-triangle-bottom');
        } else {
            children.show('fast');
            // Toggle arrow icon
            $(listItem).find('> span > i')
                .addClass('glyphicon-triangle-bottom')
                .removeClass('glyphicon-triangle-right');
        }
    }
}

$(document).ready(function () {

    // Custom: Move element details pane to right
    var detailFrame = $("iframe[name='element']").detach();

    $("<div class='ui-layout-east'></div>")
        .append(detailFrame)
        .appendTo("body");

    // Set jQuery UI Layout panes
    $('body').layout({
        minSize: 45,
        maskContents: true,
        north: {
            size: 45,
            spacing_open: 0,
            closable: false,
            resizable: false
        },
        west: {
            size: 325,
            spacing_open: 8,
            spacing_closed: 0,
            closable: true,
			onresize: "fixTreeScroll"
        },
        east: {
            size: 800,
            spacing_open: 8,
            closable: true,
            initClosed: true
        }
    });

      // Eerste keer panelhoogte zetten (voor het geval je root-panel-body gebruikt)
    setRootPanelHeight();

	$(".tree").css({
    overflowY: "auto",
    overflowX: "hidden",
    maxHeight: "calc(100vh - 120px)"
});

    // --------------------------------------------------
    // NAVIGATIE TOGGLE
    // --------------------------------------------------

    $("<div id='treeToggle'>❮</div>")
        .appendTo("body");

    $("#treeToggle").css({
        position: "fixed",
        left: "0px",
        top: "48px",

        width: "16px",
        height: "36px",
        lineHeight: "36px",

        textAlign: "center",
        cursor: "pointer",

        zIndex: 9999,

        background: "#e6e6e6",
        color: "#555",

        border: "1px solid #c8c8c8",
        borderLeft: "0",

        borderRadius: "0 4px 4px 0",

        fontSize: "14px",
        fontWeight: "bold",

        boxShadow: "0 1px 2px rgba(0,0,0,.15)"
    });

    $("#treeToggle").on("click", function () {

        var layout = $('body').data('layout');

        if (!layout)
            return;

        if (layout.state.west.isClosed) {

            layout.open('west');

            if (!layout.state.east.isClosed) {
                layout.close('east');
            }

            $(".ui-layout-center").css("padding-left", "0");

            $(this).html("❮");

        } else {

            layout.close('west');

            $(".ui-layout-center").css("padding-left", "4px");

            $(this).html("❯");

        }

    });

    // Set height of panels the first time
    setRootPanelHeight();
    $(".root-panel-heading").css("padding-left", "20px");
    $(".root-panel-body > b > a").text("Inhoud");

    // Remove hidden nodes from the model tree
    $('.hide-true').remove();
    let topTreeFolders = $('.tree > li');
    topTreeFolders.each(function (index) {
        if (!$(this).find(' > ul > li').length) {
            $(this).remove();
        }
    });

    // Weergaven vóór Model plaatsen
    var viewsNode = $(".i18n-views").closest("li");
    var modelNode = $(".i18n-model_content").closest("li");

    if (viewsNode.length && modelNode.length) {
        modelNode.before(viewsNode);
    }

    // Setup modeltree
    $('.tree li:has(ul)').addClass('parent_li').find(' > ul > li').hide();

    // Add show/hide function on modeltree
    $('.tree li.parent_li > span').on('click', function (e) {
        toggleTreeEntry($(this).parent('li.parent_li'));
        e.stopPropagation();
    });

    // *** SEARCH ***
    appendSearchBar();

    // *** DEEP LINKS ***

    // Register a new onClick function
    let $viewLinks = $("a[href][target='view']");
    $viewLinks.on('click', function (event) {
        const id = getIdFromHref(event.currentTarget.href);
        setLocationForView(id);
        openViewFromLocation(false);
        event.stopPropagation();
        return false;
    });

    function setLocationForView(id) {
        const url = new URL(window.location);
        url.searchParams.set('view', id);
        window.history.pushState({}, '', url);
    }

    function getIdFromHref(href) {
        return href.split("/").pop().slice(0, -5);
    }

    function getIdFromLocation() {
        const url = new URL(window.location);
        return url.searchParams.get('view');
    }

    function openViewFromLocation(expandModelTree) {
        // Find matching view in model tree...
        const targetId = getIdFromLocation();
        const matchingLinks = $viewLinks.filter(function (index, element) {
            return getIdFromHref(element.href) === targetId;
        });
        const link = matchingLinks[0];

        if (link) {
            // View found in model tree. Loading it in frame
            const $link = $(link);
            $("iframe[name='view']").attr('src', $link.attr('href'));

            if (expandModelTree) {
                let spans = [];
                let $parentListItem = $link.parent().parent().parent();
                while ($parentListItem[0].tagName === 'LI') {
                    spans.push($parentListItem.children().first());
                    $parentListItem = $parentListItem.parent().parent();
                }
                while (spans.length) {
                    spans.pop().click();
                }
            }
        }
    }

    $(window).on('message', function (e) {
        const id = e.originalEvent.data.split('=').pop();
        setLocationForView(id);
        //openViewFromLocation(true); 
    });

    // Automatisch navigatiepaneel sluiten bij selectie element
    var firstElementLoad = true;

    $("iframe[name='element']").on("load", function () {

        if (firstElementLoad) {
            firstElementLoad = false;
            return;
        }

        var layout = $('body').data('layout');

        if (!layout)
            return;

        if (!layout.state.west.isClosed) {

            if (layout.state.east.isClosed) {
                layout.open('east');
            }

            layout.close('west');

            $(".ui-layout-center").css("padding-left", "4px");

            $("#treeToggle").html("❯");
        }

    });

    // Load initial view id on page load
    openViewFromLocation(true);

});

function appendSearchBar() {
    let newSearchDiv = '<div id="searchBox"><input type="text" id="tree-search" placeholder="Search..." /></div>';

    document.getElementsByClassName("panel-heading")[0].innerHTML += newSearchDiv;

    document.querySelector('#tree-search').onkeyup = function (e) {
        if (e.key !== 'Enter' && e.keyCode !== 13)
            return;
        else
            searchInViews();
    };
}

function isTreeFiltered() {
    return $('#tree-search').hasClass('filtered');
}

function searchInViews() {
    const filter = $('#tree-search').val();

    // Hide all entries
    let listItems = $('.tree li');
    listItems.hide();
    listItems.find(' > span > i')
        .addClass('glyphicon-triangle-right')
        .removeClass('glyphicon-triangle-bottom');

    // Is a filter set?
    if (filter.length === 0) {
        // No: show the top level entries ('Model Content' and 'Views') and stop here
        $('.tree > li').show();
        $('#tree-search').removeClass('filtered');
        document.querySelector('#tree-search').title = "";
        return;
    }

    // Yes: set the 'filtered' flag and filter the model tree
    $('#tree-search').addClass('filtered');
    document.querySelector('#tree-search').title =
        "To clear filter, empty this field and press ENTER";

    // Get model tree
    let modelTree = $('.tree');

    // Case insensitive search (a 'li' matches if itself or its children match)
    let foundItems = modelTree.find("li").filter(function () {
        let reg = new RegExp(filter, "ig");
        let content = $(this).hasClass('tree-element')
            ? $(this)
            : $(this).find('li.tree-element');
        return reg.test(content.text());
    });

    // Show matching entries
    foundItems.show();
    foundItems.parent("ul").parent("li")
        .find("> span > i")
        .addClass('glyphicon-triangle-bottom')
        .removeClass('glyphicon-triangle-right');
}
