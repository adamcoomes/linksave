
$(document).ready(function() {

	function is_valid_url(url) {
    return url.match(/^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/);
	}


	function trimText(text, trimNum) {
		var trimmed = text.substring(0,trimNum).trim(text);
		if (trimmed.length >= trimNum)
			trimmed += '...';

		return trimmed;
	}

	function makeZoomable(obj) {
		if (!obj) {
			$('#sortable li').each(function() {
				var imageId = $(this).find('.link-info').text();
				var url = $(this).find('.link-href').text();
				var image = 'webshots/' + imageId + '.jpg';
				$(this).find('.link-bg').zoom({url: image, magnify: 1, callback: function() {
						$(this).wrap('<a href="' + url + '" style="cursor: pointer" target="_blank"></a>');
				}});
			});
		}
		else {
			var imageId = $(obj).find('.link-info').text();
			var url = $(obj).find('.link-href').text();
			var image = 'webshots/' + imageId + '.jpg';			
			$(obj).find('.link-bg').zoom({url: image, magnify: 1, callback: function() {
				$(this).wrap('<a href="' + url + '" target="_blank"></a>');
			}});		
		}
	}

	function destroyZoomable() {
		$('.link-bg').trigger('zoom.destroy');
	}

	function enableSortable() {
		$( "#sortable" ).sortable({
		  placeholder: "highlight",
	    update: function() {
		    var order = $(this).sortable('serialize');
		    $.get("/link/sort", order).done(function(result) { });
	    }}, "disabled", false );

		$( "#sortable" ).disableSelection();
	}

	function disableSortable() {
		$( "#sortable" ).sortable( "option", "disabled", true );
	}

	function toggleReorder() {
		if ($("#icon-reorder-onoff").text() === 'On') {
			disableSortable();
			makeZoomable();
			
			$("#icon-reorder-onoff").text('Off').css("color", "");
			$(".link-item").stop(true, true);
		}
		else {
			enableSortable();
			destroyZoomable();

			$("#icon-reorder-onoff").text('On').css("color", "#FF0000");
			$(".link-item").effect("shake", {
				direction: 'down',
				distance: 2,
				times: 500
			}, 250000, function() {
				$("#icon-reorder-onoff").text('Off').css("color", "");
				$(".link-item").stop(true, true);
			});
		}
	}

	makeZoomable();

	$(".link-title").each(function() {
		var trimmed = trimText($(this).text(), 60);
		$(this).text(trimmed);
	});


	$("#icon-reorder").click(function() {
		toggleReorder();
	});
	
	$("#link-form").submit(function() {

		var url = $("#link-input").val();

		if (!/^(ht|f)tps?:\/\//i.test(url))
   		url = 'http://' + url;		

		if (!is_valid_url(url))
			return false;

		var data = { url: url };

		$.get("/link/add", data).done(function(result) {

			var linkHTML = new EJS({url: '../../templates/link.ejs'}).render({link: result, defaultImage: true});

			$("#sortable").prepend(linkHTML);

			var webshotData = { url: result.info.url, id: result.info.id };
			$.post("/link/webshot", webshotData).done(function(shotFile) {
				if (shotFile != 'error') {
					var obj = $("#link-" + result.id);
					$(obj).find(".link-bg").css("background-image", "url('" + shotFile + "')").css("background-size", "165px 124px");
					makeZoomable(obj);
				}
			});
		
		});

		return false;
	});
	
	
});