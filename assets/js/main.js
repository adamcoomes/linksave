
$(document).ready(function() {

	var menuTriggerBg = $("#menu-trigger").css('background-color');

	$("#menu-trigger").mouseover(function(e) {
			$("#menu-trigger").css('background-color', '#2357b8');
	});

	$("#menu-trigger").mouseout(function(e) {
		$("#menu-trigger").css('background-color', menuTriggerBg);
	});

	$("#menu-trigger").mousedown(function(e) {
		if ($("#menu").css('display') == 'none')
			$("#menu").show();
		else
			$("#menu").hide();

		$('#link-area').masonry('layout');

		$("#menu-trigger").css('background-color', menuTriggerBg);
	});

	function is_valid_url(url) {
    return url.match(/^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/);
	}

	function trimText(text, trimNum) {
		var trimmed = text.substring(0,trimNum).trim(text);
		if (trimmed.length >= trimNum)
			trimmed += '...';

		return trimmed;
	}

	function trimElementText(elem, trimNum) {
		$(elem).each(function() {
			var trimmed = trimText($(this).text(), trimNum);
			$(this).text(trimmed);
		});
	}

	function makeTagHovers(id) {

		var tagelems = [];

		if (!id) {
			$(".tag-list").each(function() {
				tagelems.push($(this));
			});
		} else {
			tagelems.push($("#tag-list-" + id));
		}

		tagelems.forEach(function(tagelem) {
			$(tagelem).mouseover(function() {
				$(this).find('.tag-button').css('visibility', 'visible')
			});

			$(tagelem).mouseleave(function() {
				$(this).find('.tag-button').css('visibility', 'hidden');
			});

			var tag = new Object();
			tag.id = $(tagelem).find('.tag-filter-id').text();
			tag.name = $(tagelem).find('.tag-filter-name').text();

			$(tagelem).find('.tag-edit-button').click(function(e) {
				e.preventDefault();

				var editHTML = new EJS({url: '../../templates/tagedit.ejs'}).render({tag: tag});
				$("#link-modal-content").html(editHTML);

				$('#tag-edit-form').submit(function (e) {
					e.preventDefault();
					var newName = $('#edit-tag-name').val();
					
					if (newName != tag.name) {
						$.get("/tag/edit", {id: tag.id, name: newName}).done(function(result) {
							
							if (result) {
								$('.tag-filter').each(function() {
									if ($(this).find('.tag-filter-id').text() === result.id.toString())
										$(this).find('.tag-filter-name').text(result.name);
								});
							}

							$("#link-modal").modal('hide');
						
						});
					}	else {
						$("#link-modal").modal('hide');
					}
				})	
			});

			$(tagelem).find('.tag-remove-button').click(function(e) {
				e.preventDefault();
				
				if (confirm('Links will no longer have this tag. Are you sure you want to remove tag #' + tag.name + '?')) {
					$.get("/tag/remove", {id: tag.id}).done(function(result) {
						if (result) {
							$('.tag-filter').each(function() {
								if ($(this).find('.tag-filter-id').text() === tag.id)
									$(this).remove();
							});
						}
					});
				}
				else
					return false;
			});			
		});
	}

	function makeRemoveLinks(id) {
		var obj = '';

		if (id)
			obj = '#link-remove-' + id;
		else
			obj = '.link-remove-click';

		$(obj).click(function() {

			if (confirm('Are you sure you want to remove this link?')) {
				var remove = new Object();
				remove.id = $(this).attr('id').split('-')[2];

				$.post("/link/remove", remove).done(function(result) {
					$('#link-' + remove.id).hide();
					$('#link-area').masonry('layout');					
				});

			} else {
				return false;
			}
		});
	}

	function makeEditLinks(id) {
		var obj = '';

		if (id)
			obj = '#link-edit-' + id;
		else
			obj = '.link-edit-click';

		$(obj).click(function() {

			var edit = new Object();
			var editId = $(this).attr('id').split('-')[2];
			var currentTags = [];
			var tags = [];

			edit.title = $('#link-' + editId).find('.link-title').text();	
			
			$('#link-' + editId).find('.tag-filter-id').each(function() {
				currentTags.push($(this).text());
			});

			$(".tag-list").each(function () {
					var tagId = $(this).find('.tag-filter-id').text();
					var tagName = $(this).find('.tag-filter-name').text();
					var checked = '';
					if (currentTags.indexOf(tagId) != '-1')
						checked = 'checked';

					tags.push({id: tagId, name: tagName, checked: checked})
			});

			var editHTML = new EJS({url: '../../templates/linkedit.ejs'}).render({link: edit, tags: tags});
			$("#link-modal-content").html(editHTML);

			$("#edit-link-new-tag").keypress(function(e) {
		 		var key = e.which;
		 		if(key == 13) {
		  		if (!$(this).val())
		  			return false;
		  	
		  		$(this).val();

		  		var data = { name: $(this).val() };

		    	$.get("/tag/add", data).done(function(result) {
		    		if (result) {
		    			$("#link-input-tags ul").append('<li><input type="checkbox" class="select-tags" name="tags" value="'+result.id+'"> #'+result.name+'</li>');
 										
							var numCols = $(".edit-link-tag-row:last").find(".col-md-3").length;
							var numRows = $(".edit-link-tag-row .col-md-3:last").find(".edit-tags").length;

							if (numRows > 9) {
								if (numCols === 4)
									$("#edit-link-tag-area").append('<br /><div class="row edit-link-tag-row"></div>');

								$(".edit-link-tag-row:last").append('<div class="col-md-3"></div>');
							}

							$(".edit-link-tag-row:last .col-md-3:last").append('<input type="checkbox" class="edit-tags" name="tags" value="' + result.id + '" checked> ' + result.name + '<br />');

							var tagHTML = new EJS({url: '../../templates/tag.ejs'}).render({tag: result});
							$("#tags-area").append(tagHTML);

							makeTagHovers(result.id);
						}
		    	});

		    	return false;  					
				}
			});

			$("#link-edit-form").submit(function(e) {
				e.preventDefault();

				$('#link-edit-submit').button('loading');

				var data = new Object();
				data.id = editId;
				data.title = $("#edit-title").val();
				data.tags = [];

				$(".edit-tags").each(function() {
					if ($(this).is(":checked"))
						data.tags.push($(this).val());
				});	

				$.post("/link/edit", data).done(function(result) {

					$('#link-' + editId).find('.link-title').text(result.title);
					var tagelem = $('#link-' + editId).find('.link-tags');
					var tagHTML = '';
					
					result.tags.forEach(function(tag) {
						tagHTML += '<a class="tag-filter" href="#"><span class="tag-filter-id" style="display: none">' + tag.id + '</span>#<span class="tag-filter-name">' + tag.name + '</span>&nbsp;</a> ';
					});

					tagelem.html(tagHTML);
					$('#link-area').masonry('layout');

					$('#link-edit-submit').button('reset');
					$("#link-modal").modal('hide');
					makeTags();
	 			
	 			});
			});
		});		
	}

	function filterLinks(tag) {
		// Make the corresponding side menu tag show or hide 'tag-selected' class 
		$('#tag-filter-' + tag).parent('.tag-list').toggleClass('tag-selected');

		if ($('#filter-item-' + tag).length) 
			$('#filter-item-' + tag).remove();
		
		var tagIds = [];

		$(".tag-selected").find(".tag-link").each(function() {
			var tagName = $(this).find('.tag-filter-name').text();
			var tagId = $(this).find('.tag-filter-id').text();
			tagIds.push(tagId);

			if (!$('#filter-item-' + tagId).length) {
				$('#filter-area').append('<div class="filter-item" id="filter-item-' + tagId + '">' + tagName + ' <span class="glyphicon glyphicon-remove"></span></div>');
				$('#filter-item-' + tagId).css('cursor', 'pointer');
				$('#filter-item-' + tagId).click(function() {
					filterLinks(tagId);
				});
			}
		});

		if (!$('.filter-item').length) {
			$('.filter-type').remove();
			$('#filter-area').hide();
		} else {
			if ($('#filter-area').css('display') === 'none') {
				$('#filter-text').append(' <span class="filter-type">tags</span>');				
				$('#filter-area').show();
			}
		}

		var tagNum = tagIds.length;

		$('.link-item').each(function() {
			var tagMatch = 0;
			var linkItem = $(this);
				
			$(linkItem).find('.tag-filter-id').each(function() {
				if (tagIds.indexOf($(this).text()) != '-1') {
					$(this).parent('a').css('font-weight', 'bold');
					tagMatch++;
				} else {
					$(this).parent('a').css('font-weight', 'normal');
				}
			});

			if (tagMatch != tagNum)
				$(linkItem).hide();
			else
				$(linkItem).show();
		});		

		$('#link-area').masonry('layout');

	}

	function makeTags() {
		// Check each tag link
		$('.tag-link').each(function() {

			$(this).click(function(e) {
				e.preventDefault();

				var id = $(this).find('.tag-filter-id').text();

				filterLinks(id);

			});
		});
	};

	function makeZoomable(id) {
		if (!id) {
			$('.link-inner').each(function() {
				
				var imageId = $(this).find('.link-info').text();
				var url = $(this).find('.link-href').text();
				var image = 'webshots/' + imageId + '.jpg';
				
				$(this).find('.link-webshot').zoom({url: image, magnify: 1, callback: function() {
						$(this).wrap('<a href="' + url + '" title="' + url + '" style="cursor: pointer" target="_blank"></a>');
				}});

			});
		} else {
			var obj = '#link-' + id;			
			var imageId = $(obj).find('.link-info').text();
			var url = $(obj).find('.link-href').text();
			var image = 'webshots/' + imageId + '.jpg';			
			
			$(obj).find('.link-webshot').zoom({url: image, magnify: 1, callback: function() {
				$(this).wrap('<a href="' + url + '" title="' + url + '" target="_blank"></a>');
			}});		
		}
	}

	function makeShareLinks(id) {
		var obj = '';

		if (id)
			obj = '#link-share-' + id + ' a';
		else
			obj = '.link-share-icons a';

		$(obj).click(function(e) {

			e.preventDefault();

			var url = this.href, w = 500, h = 400, left = (screen.width / 2) - (w / 2), top = (screen.height / 2) - (h / 2);

			window.open(url, 'Social Share', 'toolbar=no, location=no, directories=no, status=no,' +
				' menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
		});	
	}

	$("#link-input-tags").click(function(e) {
      e.stopPropagation();
   });

	$("#link-new-tag").keypress(function (e) {
 		var key = e.which;
 		if(key == 13)  // the enter key code
  	{
  		if (!$(this).val())
  			return false;
  	
  		$(this).val();

  		var data = { name: $(this).val() };

    	$.get("/tag/add", data).done(function(result) {
    		if (result) {
    			$("#link-input-tags ul").append('<li><input type="checkbox" class="select-tags" name="tags" value="'+result.id+'"> #'+result.name+'</li>');
 					$("#tags-area").append('<div class="tag-list"><a class="tag-filter" href="#"><span class="tag-filter-id" style="display: none">' + result.id + '</span>#<span class="tag-filter-name">' + result.name + '</span></a></div>');
				}
    	});

    	return false;  
  	}
	});   

	$('#link-area').masonry({ columnWidth: 200, itemSelector: '.link-item', gutter: 10 });

	$(".main-area").css("visibility", "visible");

	makeZoomable();
	makeShareLinks();
	makeEditLinks();
	makeRemoveLinks();
	makeTags();
	makeTagHovers();

	trimElementText(".link-title", 100);
	trimElementText(".link-url p", 30);

	$("#link-form").submit(function(e) {

		e.preventDefault();
		var url = $("#link-input").val();
		var tags = [];

		if (!url)
			return false;

		$('#addButton').button('loading');

		$(".select-tags").each(function() {
			if ($(this).is(":checked"))
				tags.push($(this).val());
		});

		if (!/^(ht|f)tps?:\/\//i.test(url))
   		url = 'http://' + url;		

		if (!is_valid_url(url))
			return false;

		var data = { url: url, tags: tags };

		$.get("/link/add", data).done(function(result) {

			$('#addButton').button('reset');

			// $("#alert-text").text('SUCCESS!');
			// $(".alert").removeClass('alert-danger').addClass('alert-success').alert().fadeIn();

			var id = result.id;

			var linkHTML = new EJS({url: '../../templates/link.ejs'}).render({link: result, defaultImage: true});
			$("#link-area").prepend(linkHTML);

			$('#link-area').masonry( 'prepended', $(".link-item").first() );
			trimElementText(".link-title:first", 100);
			trimElementText(".link-url:first p", 30);
			makeShareLinks(id);
			makeEditLinks(id);
			makeRemoveLinks(id);
			makeTags();

			var webshotData = { url: result.info.url, id: result.info.id };

			$.post("/link/webshot", webshotData).done(function(shotFile) {

				if (shotFile != 'error') {
					$('#link-'+id).find(".link-webshot img").attr("src", shotFile);
					makeZoomable(id);
				}
			
			});

		});
	});
});