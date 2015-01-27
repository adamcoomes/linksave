$(document).ready(function() {

	$(window).load(function() {
		if ($("#showVerify").length) {
			swal({
			  title: "Thanks!",
			  text: "Your email has been confirmed.",
			  type: "success",
			  showCancelButton: false,
			  confirmButtonText: "Cool",
			  closeOnConfirm: true
			});

			$('#tagButton').prop("disabled",false);
			$("#unverified").remove();
		}
	});

	var page = 0;
	var done = false;
	var csrf = '';
	var baseURL = location.protocol + "//" + location.host;
	var totalLinks = 0;

	$.ajax({
		type: 'GET',
		url: '/csrfToken',
		async: false
	}).done(function(data) {
		csrf = data._csrf;
	});

		$(window).scroll(function() {
		  if($(window).scrollTop() + window.innerHeight == $(document).height()) {
				if (!done) {
		    	page++;					
		    	loadLinks(true, true, page);
		  	}
		  }
		});


	$('#link-area').masonry();	

	function loadLinks(async, layout, pg, tags) {
		var limit = 20;

		if (!pg)
			pg = page;

		done = true;		

		if (parseInt(pg) < 1) {
			$("#link-area").html('');
		}

		var data = {_csrf: csrf, page: pg, limit: limit};
		if (tags) {
			data.tags = tags;
		}

		$.ajax({
			type: 'GET',
			url: '/api/link/load',
			data: data,
			async: async
		}).done(function(results) {
			if (results.hasOwnProperty('done')) {
				if (results.done)
					done = true;
				else {
					if (!tags)
						done = false;
				}
			}

			var links = results.links;

			links.forEach(function(link) {
				totalLinks++;
				var id = link.id
				var linkHTML = new EJS({url: '../../templates/link.ejs'}).render({link: link});

				$("#link-area").append(linkHTML);

				trimElementText(".link-title:last", 150);
				trimElementText(".link-url:last p", 35);
				makeShareLinks(id);
				makeEditLinks(id);
				makeRemoveLinks(id);
				makeLinkVisits(id);

				if (link.embed)
					$('#link-' + id).find(".link-webshot").html(link.embed);
				//else
					//checkWebshotExists(link.info.id, id);				
				else
					makeZoomable(id);
			});

			if (layout) {
				if($("#link-area").masonry)
					$("#link-area").masonry('destroy');
				$('#link-area').masonry({ columnWidth: 240, itemSelector: '.link-item', gutter: 10 });
			}

			makeTags();
		});

	}

	// $('.main-area').jscroll({
	// 	nextSelector: ".main-area a:last",
 //  	callback: function() {
 //  		// loadLinks(1, true, true);
 //  		alert ('hi');
 //  	}
	// });

	// $('body').endlessScroll({
 //    fireOnce: false,
 //    inflowPixels: 100,
 //    callback: function(p) {
 //    	alert('hi');
 //    }		
	// });

	// $('.main-area').infinitescroll({
	// 	nextSelector: ".main-area a:last"
	// }, function(json) {
	// 	alert('hi')
	// });

	if ($("#unverified").length) {
		$("#alert-close").hide();
		$(".alert").alert().show();
		$('#tagButton').prop("disabled",true);		
	}

	function checkWebshotExists(infoId, linkId) {
		var links = [];
		if (linkId) {
			links[0] = $('#link-'+linkId);
		} else {
			$('.link-item').each(function() {
				if ($(this).find('.link-info').text() === infoId)
					links.push($(this));
			});
		}

		links.forEach(function(item) {
			
			var embed = $(item).find('iframe').length;

			if (!embed) {
				var id = $(item).find('.link-id').text();
				var shotFile = baseURL + '/webshots/' + infoId + '.jpg';
				var defaultImg = baseURL + '/webshots/default.jpg';
				var url = $(item).find('.link-href').text();

				$.ajax({
		    			url: shotFile,
		    			type:'HEAD',
		    			data: {_csrf: csrf},
	  				error: function() {
	  					updateWebshotImage(defaultImg, id);	 						
						updateWebshot(url, infoId, id, false);
 					},
	  				success: function() {
	      					updateWebshotImage(shotFile, id);
	  				}
				});
			}
		});
	}

	function updateWebshotImage(shotFile, linkId) {
		$('#link-'+linkId).find(".link-webshot-img").attr("src", shotFile);
		makeZoomable(linkId);
	}	

	function updateWebshot(url, infoId, linkId, time) {
		var webshotData = { url: url, linkId: linkId, infoId: infoId, time: time };

		io.socket.get("/api/link/webshot", webshotData, function(resp) {
			if (resp === 'done')
				updateWebshotImage('webshots/' + infoId + '.jpg', linkId);
		});

		// $.post("/api/link/webshot", webshotData).done(function(response) {
		// 	if (response === 'done')
		// 		checkWebshotExists(linkId, infoId);
		// });
	}

	function checkWebshotTime() {
		$(".link-item").each(function() {
			var embed = $(this).find('iframe').length;

			if (!embed) {
				var linkId = $(this).find('.link-id').text();
				var updateDate = $(this).find('.link-webshot-updated').text();
				var now = new Date();
				var updated = new Date(updateDate);
				var sinceUpdate = parseInt(now.valueOf()) - parseInt(updated.valueOf());
				var checkAgainst = 1000 * 60 * 24 * 30;


				if (sinceUpdate > checkAgainst) {
					var url = $(this).find('.link-href').text();
					var infoId = $(this).find('.link-info').text();

					updateWebshot(url, infoId, linkId, true);
				}
			}
		});
	}

	function makeLinkVisits(id) {
		var obj = '';

		if (id)
			obj = '.link-visit-' + id;
		else
			obj = '.link-visit';


		$(obj).click(function(e) {
			var href = $(this).attr('href');
			var linkItem = $(this).parents('.link-item');

			if (!id)
				id = $(linkItem).find('.link-id').text();
			
			$.get("/api/link/visit", {id: id, ajax: true, _csrf: csrf}).done(function(result) {
				var count = parseInt($(linkItem).find('.link-visits-text').text()) + 1;
				$(linkItem).find('.link-visits-text').text(count);
			});
		});
	}

	function is_valid_url(url) {
    return url.match(/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i);
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

	//Make edit/remove hovers and clicks for the left-hand menu tags

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
				$("#main-modal-content").html(editHTML);

				$('#tag-edit-form').submit(function (e) {
					e.preventDefault();
					var newName = $('#edit-tag-name').val();
					
					if (newName != tag.name) {
						$.get("/api/tag/edit", {id: tag.id, name: newName, _csrf: csrf}).done(function(result) {
							
							if (result) {
								$('.tag-filter').each(function() {
									if ($(this).find('.tag-filter-id').text() === result.id.toString())
										$(this).find('.tag-filter-name').text(result.name);
								});

								$("#link-input-tag-" + result.id).text(result.name);
							}

							$("#main-modal").modal('hide');
						
						});
					}	else {
						$("#main-modal").modal('hide');
					}
				})	
			});

			$(tagelem).find('.tag-remove-button').click(function(e) {
				e.preventDefault();
				
				swal({
				  title: "Are you sure?",
				  text: "Links will no longer have this tag.",
				  type: "warning",
				  showCancelButton: true,
				  confirmButtonClass: "btn-danger",
				  confirmButtonText: "Ok, delete",
				  cancelButtonText: "Cancel",
				  closeOnConfirm: false,
				  closeOnCancel: true
				},
				function(isConfirm) {
				  if (isConfirm) {

					$.get("/api/tag/remove", {id: tag.id, _csrf: csrf}).done(function(result) {
						if (result) {
							$('.tag-filter').each(function() {
								if ($(this).find('.tag-filter-id').text() === tag.id)
									$(this).remove();

								swal("Deleted!", "Your tag was removed.", "success");	
							});
						}
					});
				  }
				});
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

			var thisObj = $(this);

			swal({
			  title: "Are you sure?",
			  text: "Do you really want to remove this link?",
			  type: "warning",
			  showCancelButton: true,
			  confirmButtonClass: "btn-danger",
			  confirmButtonText: "Yes, delete",
			  cancelButtonText: "No, cancel",
			  closeOnConfirm: false,
			  closeOnCancel: true
			},
			function(isConfirm) {
			  if (isConfirm) {
				var remove = new Object();
				remove.id = $(thisObj).attr('id').split('-')[2];
				remove._csrf = csrf;

				$.post("/api/link/remove", remove).done(function(result) {
					$('#link-' + remove.id).hide();
					$('#link-area').masonry('layout');
					swal("Deleted!", "Your link has been removed.", "success");		
				});
			  } else {
			    
			  }
			});
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
			$("#main-modal-content").html(editHTML);

			$("#edit-link-new-tag").keypress(function(e) {
		 		var key = e.which;
		 		if(key == 13) {
		  		if (!$(this).val())
		  			return false;
		  	
		  		$(this).val();

		  		var data = { name: $(this).val(), _csrf: csrf };

		    	$.get("/api/tag/add", data).done(function(result) {
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
				data._csrf = csrf;

				$(".edit-tags").each(function() {
					if ($(this).is(":checked"))
						data.tags.push($(this).val());
				});	

				$.post("/api/link/edit", data).done(function(result) {

					$('#link-' + editId).find('.link-title').text(result.title);
					var tagelem = $('#link-' + editId).find('.link-tags');
					var tagHTML = '';

					if (result.hasOwnProperty('tags')) {				
						result.tags.forEach(function(tag) {
							tagHTML += '<a class="tag-filter tag-link" href="#"><span class="tag-filter-id" style="display: none">' + tag.id + '</span>#<span class="tag-filter-name">' + tag.name + '</span>&nbsp;</a> ';
						});

						tagelem.html(tagHTML);		
					}



					$('#link-area').masonry('layout');

					$('#link-edit-submit').button('reset');
					$("#main-modal").modal('hide');
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

		page = 0;
		if (tagIds.length)
			loadLinks(true, true, page, tagIds);
		else
			loadLinks(true, true, page);

		//var tagNum = tagIds.length;

		// $('.link-item').each(function() {
		// 	var tagMatch = 0;
		// 	var linkItem = $(this);
				
		// 	$(linkItem).find('.tag-filter-id').each(function() {
		// 		if (tagIds.indexOf($(this).text()) != '-1') {
		// 			$(this).parent('a').css('font-weight', 'bold');
		// 			tagMatch++;
		// 		} else {
		// 			$(this).parent('a').css('font-weight', 'normal');
		// 		}
		// 	});

		// 	if (tagMatch != tagNum)
		// 		$(linkItem).hide();
		// 	else
		// 		$(linkItem).show();
		// });

	}

	function makeTags() {
		// Check each tag link
		$('.tag-link').each(function() {

			$(this).unbind('click');
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

				if (!$(this).find('iframe').length) {
					var imageId = $(this).find('.link-info').text();
					var id = $(this).find('.link-id').text();
					var url = $(this).find('.link-href').text();
					var image = 'webshots/' + imageId + '.jpg';
					
					$(this).find('.link-webshot').zoom({url: image, magnify: 1, callback: function() {
							$(this).wrap('<a class="link-visit link-visit-' + id + '" href="' + url + '" title="' + url + '" style="cursor: pointer" target="_blank"></a>');
					}});
				}

			});
		} else {
			var obj = '#link-' + id;			

			if (!$(obj).find('iframe').length) {
				var imageId = $(obj).find('.link-info').text();
				var url = $(obj).find('.link-href').text();
				var image = 'webshots/' + imageId + '.jpg';			
				
				$(obj).find('.link-webshot').zoom({url: image, magnify: 1, callback: function() {
					$(this).wrap('<a class="link-visit link-visit-' + id + '" href="' + url + '" title="' + url + '" style="cursor: pointer" target="_blank"></a>');
				}});
			}	
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
  		var inputbox = $(this);

  		if (!$(this).val())
  			return false;

  		var data = { name: $(this).val(), _csrf: csrf };

    	$.get("/api/tag/add", data).done(function(result) {
    		if (result) {
    			$("#link-input-tags ul").append('<li><input type="checkbox" class="select-tags" name="tags" value="'+result.id+'"> #'+result.name+'</li>');
    			var tagHTML = new EJS({url: '../../templates/tag.ejs'}).render({tag: result});
					$("#tags-area").append(tagHTML);
					$(inputbox).val('');
					makeTagHovers(result.id);
				}
    	});

    	return false;  
  	}
	});

	loadLinks(false, true, page);
	checkWebshotTime();
	if ((!totalLinks) && (!($("#showVerify").length))) {
		$('body').chardinJs('start');	
	}	

	io.socket.on('webshotSock', function(data) {
		updateWebshotImage('webshots/' + data.infoId + '.jpg', data.linkId);
	});	

	makeTagHovers();

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


	$(".main-area").css("visibility", "visible");	

	$("#link-form").submit(function(e) {

		e.preventDefault();
	
		if ($("#unverified").length) {
			swal({
			  title: "Sorry!",
			  text: "You must confirm your email address before adding links.",
			  type: "error",
			  showCancelButton: false,
			  confirmButtonText: "Got it",
			  closeOnConfirm: true
			});			
			return false;
		}

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

		if (!is_valid_url(url)) {
			$('#addButton').button('reset');
			return false;
		}

		var data = { url: url, tags: tags, _csrf: csrf };

		$.get("/api/link/add", data).done(function(result) {

			totalLinks++;

			$('#addButton').button('reset');

			if (result === 'error') {
				swal("Error", "This link could not be saved. Check to make sure the URL is working.", "error");
				return false;
			}

			$("#link-input").val('');

			var id = result.id;

			var linkHTML = new EJS({url: '../../templates/link.ejs'}).render({link: result, defaultImage: true});

			$("#link-area").prepend(linkHTML);

			trimElementText(".link-title:first", 150);
			trimElementText(".link-url:first p", 35);
			makeShareLinks(id);
			makeEditLinks(id);
			makeRemoveLinks(id);
			makeLinkVisits(id);

			if (!result.embed)
				updateWebshot(result.info.url, result.info.id, id);
			else
				$('#link-' + id).find(".link-webshot").html(result.embed);

			$('#link-area').masonry( 'prepended', $(".link-item").first() );
			makeTags();

		});
	});
});
