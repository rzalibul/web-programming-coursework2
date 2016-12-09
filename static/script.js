"use strict";
// utility functions for local storage with use of JSON
// function setObject(key, value) 
// {
	// window.localStorage.setItem(key, JSON.stringify(value));
// };
// function getObject(key) 
// {
	// var storage = window.localStorage;
	// var value = storage.getItem(key);
	// return value && JSON.parse(value);
// };
// function clearStorage() 
// {
	// // removes everything placed in localstorage
	// window.localStorage.clear();
// };

// escape HTML characters function
// source: http://stackoverflow.com/questions/24816/escaping-html-strings-with-jquery
function escapeHtml(string) 
{
	var entityMap = 
	{
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': '&quot;',
		"'": '&#39;',
		"/": '&#x2F;'
	};
	return String(string).replace
	(
		/[&<>"'\/]/g, 
		function(s) 
		{
			return entityMap[s];
		}
	);
	// perform a global match for characters in the regular expression and return the corresponding HTML escape character that is mapped in entity map
}
/* login/logout requests */
function logout()
{
	$.ajax
	(
		{
			url: '/logout',
			data: '',
			type: 'GET',
			success: function(response)
			{
				location.reload();
			},
			error: function(response)
			{
				console.log(response);
			}
		}
	);
}

/* review page functionality */
function saveComment()
{
//	var cText = $('#commentBox').val();
//	var cName = $('#nameBox').val();
	// above could be used for client-side validation
	if ($('span.stars.starSelected').index() != -1)						// if a star has been selected, proceed
	{
		var rating = 5 - $('span.stars.starSelected').index();			// nodes are in inverted order (check reviews.css if required)
		$('form#newCmt > input.hiddenRating').val(rating);				// wrap the rating in an input element to push through HTTP request
	}
	else
		$('form#newCmt > input.hiddenRating').val(0);					// otherwise, set rating to 0
	$.ajax
	(
		{
			url: '/saveComment',
			data: $('form#newCmt').serialize(),
			type: 'POST',
			success: function(response)
			{
				// parse the response into proper fields (id, author, comment, rating, date)
				var cmtList = JSON.parse(response);
				// format it into proper HTML
				// to do: if cmtList.rating == 0 then don't add rating stars/add "no rating" string
				cmtList.rating = -1*(parseInt(cmtList.rating) - 5);				// revert the node index back
				var curRating = '<div class=rating><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span></div>';
				// remove the star selection until the rating is adjusted properly
				for (var i = 0; i < cmtList.rating; i++)
				{
					curRating = curRating.replace('class="starSelected"', '');
				}
				var prevComments = $('#commentList').html();
				var curComment = '<div id="cmt_' + cmtList.id + '"><span class="cmtName">' + cmtList.author + ' says:' + '</span><p class="comment">' + cmtList.comment + '</p>' + 'Rating:' + curRating + '<span class="date">' + cmtList.date + '</span><button class="cmtBtn" value="Modify" onclick="modifyComment(' + cmtList.id + ')">Modify</button><button class="cmtBtn" value="Delete" onclick="deleteComment(' + cmtList.id + ')">Delete</button></div>' + prevComments;
				// to do: buttons are only visible if user is in session
				$('#commentList').empty();
				$('#commentList').append(curComment);
			},
			error: function(response)
			{
				console.log(response);
			}
		}
	);
}

function modifyComment(id)
{
	//id = parseInt(id);
	// check whether another comment area exists that isn't the one that is associated with the currently clicked button
	if($('div.commentArea > form[id^="modCmt_"]').length && ($('div.commentArea > form[id^="modCmt_"]').attr('id') != ('modCmt_' + id)))
	{
		// a comment area for modifying comments already exists for another node - remove it
		$('div.commentArea > form[id^="modCmt_"]').remove();
		modifyComment.isFirstClick = !(modifyComment.isFirstClick);		// change the state of property to correct the state of the comment form
	}
	// negate the function property to keep track of whether the form should be opened or XHR should be sent (or create it if undefined)
	modifyComment.isFirstClick = !(modifyComment.isFirstClick);
	if(modifyComment.isFirstClick)
	{
		var newCmtArea = '<div class="commentArea"><form id="modCmt_' + id + '" class="reviewForm" action="/modifyComment" method="post" role="form">Your modified comment: <textarea class="commentBox" name="comment" placeholder="Enter your comment..."></textarea><br />Your rating (if applicable): <div class="rating"><span class="stars">&#9734;</span><span class="stars">&#9734;</span><span class="stars">&#9734;</span><span class="stars">&#9734;</span><span class="stars">&#9734;</span></div><input class="hiddenRating" name="rating" type="number" hidden /></form></div>'
		$('div#cmt_' + id).append(newCmtArea);		// append the comment area for modifying comments
		// attach an event
		$('span.stars').click						// selects a particular rating on click
		(
			function(event)
			{
				$('span.stars.starSelected').removeClass('starSelected');
				$(event.target).addClass('starSelected');
			}
		);
	}
	else
	{
		if ($('form#modCmt_' + id + '> div.rating > span.stars.starSelected').index() != -1)					// if a star has been selected, proceed
		{
			var rating = 5 - $('form#modCmt_' + id + '> div.rating > span.stars.starSelected').index();			// nodes are in inverted order (check reviews.css if required)
			$('form#modCmt_' + id + ' > input.hiddenRating').val(rating);							// wrap the rating in an input element to push through HTTP request
		}
		else
			$('form#modCmt_' + id + ' > input.hiddenRating').val(0);								// otherwise, set rating to 0
		// send data
		$.ajax
		(
			{
				url: '/modifyComment',
				data: $('form#modCmt_' + id).serialize() + '&cmt_id=' + id,
				type: 'POST',
				success: function(response)
				{
					console.log(response);
					var modifiedCmt = JSON.parse(response);
					modifiedCmt.rating = -1*(parseInt(modifiedCmt.rating) - 5);		// format the rating for correct display in DOM
					var curRating = '<div class=rating><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span></div>';
					// remove the star selection until the rating is adjusted properly
					for (var i = 0; i < modifiedCmt.rating; i++)
					{
						curRating = curRating.replace('class="starSelected"', '');
					}
					var curComment = '<span class="cmtName">' + modifiedCmt.author + ' says:' + '</span><p class="comment">' + modifiedCmt.comment + '</p>' + 'Rating:' + curRating + '<span class="date">' + modifiedCmt.date + '</span><button class="cmtBtn" value="Modify" onclick="modifyComment(' + modifiedCmt.id + ')">Modify</button><button class="cmtBtn" value="Delete" onclick="deleteComment(' + modifiedCmt.id + ')">Delete</button>';
					
					$('div#cmt_' + id).empty();
					$('div#cmt_' + id).append(curComment);
					// no need to remove the commenting section as it was already emptied
				},
				error: function(response)
				{
					console.log(response);
					// remove the comment section
					$('form#modCmt_' + id).remove();
				}
			}
		);
	}
}

function deleteComment(id)
{
	var response = confirm('Are you sure you want to delete this comment?');
	if(response)
	{
		$.ajax
		(
			{
				url: '/deleteComment',
				data: 'cmt_id=' + id,
				type: 'POST',
				success: function(response)
				{
					response = JSON.parse(response);
					if(response.status == "OK")
					{
						$('div#cmt_' + id).remove();
						alert('Comment removed!');
					}
				},
				error: function(response)
				{
					
				}
			}
		);
	}
}

function clearComment()
{
	$("#nameBox").val("");
	$("#commentBox").val("");
	$("#hiddenRating").val("");
}

function fetchComments()
{
	$.getJSON
	(
		"/fetchComments",
		function(data)
		{
			if(data != "")							// proceed if JSON request is not empty
			{
				//console.log(data);
				var cmtList = JSON.parse(data);
				cmtList = cmtList.item;				// default value for the whole collection (see init_website.py fetchComments and CsvFileToJSON subroutines)
				var comments = '';
				var curRating;
				$.each
				(
					cmtList,
					function(key, val)
					{
						val.rating = -1*(parseInt(val.rating) - 5);				// revert the node index back
						curRating = '<div class=rating><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span><span class="starSelected">&#9734;</span></div>';
						// remove the star selection until the rating is adjusted to proper value
						for (var i = 0; i < val.rating; i++)
						{
							curRating = curRating.replace('class="starSelected"', '');
						}
						comments += '<div id="cmt_' + val.id + '"><span class="cmtName">' + val.author + ' says:' + '</span><p class="comment">' + val.comment + '</p>' + 'Rating:' + curRating + '<span class="date">' + val.date + '</span><button class="cmtBtn" value="Modify" onclick="modifyComment(' + val.id + ')">Modify</button><button class="cmtBtn" value="Delete" onclick="deleteComment(' + val.id + ')">Delete</button></div>';
					}
				);
				$('#commentList').append(comments);
			}
		}
	);
}

$('span.stars').click				// selects a particular rating on click
(
	function(event)
	{
		$('span.stars.starSelected').removeClass('starSelected');
		$(event.target).addClass('starSelected');
	}
);

/* gallery page functionality */
function getImgList()				// returns a list of images
{
	return [
		'1.jpg', 
		'2.jpg', 
		'3.jpg', 
		'4.jpg', 
		'5.jpg',
		'6.jpg',
		'7.jpg',
		'8.jpg',
		'9.jpg',
		'10.jpg',
		'11.jpg',
		'12.jpg',
		'13.jpg',
		'14.jpg',
		'15.jpg',
		'16.jpg',
		'17.jpg',
		'18.jpg',
		'19.jpg'
	];
}

function changeSlidebar(imgList, index, reverse)						// if reverse is true, then get the previous indices
{
	var curThumbnails = document.getElementsByClassName("thumbnail");
	if(reverse)
	{
		if(index % 5 == 4)									// 5 images in a slidebar - that means every fifth image is the last
		{
			for(var j = 0; j < 5; j++)
			{
				$("div#prevSlidebarImg").after("<img class='thumbnail' src='img/" + imgList[index - j] + "' alt='Image " + (index - j + 1) + "' longdesc='" + (index - j) + "' />");
				// subsequently append slidebar images
			}
			$("img.thumbnail").css("top", "-810px");		
			/* 	5 * thumbnail height which is 160px + 10px which is sum of vertical borders and take the negative to correct current position
			 * 	as appended images are BEFORE the current ones, meaning they pushed the current ones
			 * 	out of div#slidebar scope
			 */
			$("img.thumbnail").animate	// to do: add queueing
			(
				{
					top: "-3vh"			// absolute position of a thumbnail in relation to slidebar (look at relevant selector in styles.css)
				},
				1000,
				function()
				{
				}
			);
			
			setTimeout
			(
				function()
				{
					for(var j = 4; j > -1; j--)
						$(curThumbnails[5]).remove();	
				// the variable holds a reference, not an actual value, therefore after removing a node, next one moves automatically to that position
				// additionally, the nodes we are deleting are after the ones appended, hence 5 as index
				},
				1000
			);
			// synchronise animating with removal of nodes that are no longer needed
		
		}
	}
	else								// if reverse is anything but true or 1, then load next thumbnails
	{
		if(index % 5 == 0)
		{
			for(var j = 0; j < 5; j++)						// iterating downwards makes it easier to manipulate image tags as required
			{
				if (imgList[j + index] === undefined)
				{
					$("div#nextSlidebarImg").before("<img class='thumbnail' src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' alt='Pixel' />");
					// replace image with a transparent pixel; source: https://css-tricks.com/snippets/html/base64-encode-of-1x1px-transparent-gif/
				}
				else
				{
					$("div#nextSlidebarImg").before("<img class='thumbnail' src='img/" + imgList[index + j] + "' alt='Image " + (index + j + 1) +  "' longdesc='" + (index + j) + "' />");
					// subsequently append slidebar images before the next slidebar iteration button 
				}
			}
			$("img.thumbnail").animate
			(
				{
					top: "-840px"					// no clue whatsoever
				},
				1000,
				function()
				{
					$("img.thumbnail").css("top", "-3vh");
				}
			);	
			setTimeout
			(
				function()
				{
					for(var j = 0; j < 5; j++)
						$(curThumbnails[0]).remove();
					// similarly to above; however, images are appended after the last current image and before next button, hence index = 0
				},
				1000
			);
		}
	}
	
	$("img.thumbnail").click					// need to rebind event handler as event triggers were subsequently removed and appended
	(
		function()
		{
			changeCurImage(this);
		}
	);
}

$("img.thumbnail").click
(
	function()
	{
		changeCurImage(this);
	}
);

function changeCurImage(selector)				// event trigger is passed by reference to this argument
{
	if($(selector).attr("longdesc") == null)		// if the image does not have an 'index' attribute, then it's not a valid image to display
		return;
	var index = parseInt($(selector).attr("longdesc"));	// get the index value and cast it to int
	var mainImg = document.getElementById("fullSize");
	mainImg.src = selector.src;
	$(mainImg).attr("longdesc", index);
}

$(".imgNav").click
(
	function changeAdjImage(event)
	{
		var imgList = getImgList();
		// defining array of image paths
		var selector = event.target.id;								// selector will hold the id of event object (prevImg or nextImg in this case)
		var index = parseInt($("img#fullSize").attr("longdesc"));	// get the 'index' from the current displayed image and cast it to integer

		if(selector === "prevImg")
			index--;
		else														
			index++;
		
		if(index >= 0)												// display the previous/next image in this case
		{
			if(imgList[index] != undefined)
			{
				var mainImg = document.getElementById("fullSize");
				mainImg.src = "img/" + imgList[index];
				$(mainImg).attr("longdesc", index);
				$(mainImg).attr("alt", "Image " + (index + 1));
			}
			
			if(selector === "prevImg")
				changeSlidebar(imgList, index, true);
			else
				changeSlidebar(imgList, index, false);
		}
		else		// the slidebar could be overflown if desired; otherwise there is nothing else to do
		{
			
		}	
	}
);

$("div.imgSlideNav").click
(
	function(event)
	{
		var imgList = getImgList();
		var firstIndex = parseInt($("img.thumbnail").attr("longdesc"));

		if(event.target.id == "prevSlidebarImg")
			changeSlidebar(imgList, firstIndex - 1, true);
		else
		{
			if(firstIndex > imgList.length - 5)				// prevent the slidebar from getting a bunch of "empty images"
				return;
			changeSlidebar(imgList, firstIndex + 5, false);
		}
		// when faced with multiple selection, .attr() method returns the first element's result
		// therefore, index must be increased to a value out of bounds for current slidebar selection
		// 1 to the left (previous) is already out of bounds relative to the first element
		// while 5 needs to be added to the first index as it is the overall number of images in slidebar
	}
);

$("img#fullSize").click
(
	function(event)
	{
		var imgSrc = event.target.src;
		$("div#mainImg").append("<div class='fullScreen'></div><img class='bigImage' src='" + imgSrc + "' alt='Full Screen " + event.target.alt + "' />");
		$(".fullScreen, .bigImage").click				// events need to be bound here as relevant nodes are not present until they are appended
		(
			function()
			{
				$(".fullScreen").remove();
				$(".bigImage").remove();
			}
		);
	}
);