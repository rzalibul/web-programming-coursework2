"use strict";
// utility functions for local storage with use of JSON
function setObject(key, value) 
{
	window.localStorage.setItem(key, JSON.stringify(value));
};
function getObject(key) 
{
	var storage = window.localStorage;
	var value = storage.getItem(key);
	return value && JSON.parse(value);
};
function clearStorage() 
{
	// removes everything placed in localstorage
	window.localStorage.clear();
};

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

/* review page functionality */
function saveComment()
{
	var cText = escapeHtml($('#commentBox').val());			// escape certain characters to prevent XSS injection
	var cName = $('#nameBox').val();
	if (cName === "")
		cName = "Anonymous";
	else
		cName = escapeHtml(cName);							// if it's not an empty string, escape certain characters
		
	var prevComments = $('#commentList').html() == '<span class="cmtName">No comments</span>' ? "" : $('#commentList').html();
	var prevLinks = $('#sideNav').html();
	// if there are no comments loaded, 'No comments' span element is present and in order to remove it, it needs to be checked
	// if it is present, assign empty string, otherwise proceed normally
	/*
		equivalent to:
		var prevComments;
		if($('#commentList').html() == '<span class="cmtName">No comments</span>')
			prevComments = "";
		else
			prevComments = $('#commentList').html();
	*/
	if ($('.stars.starSelected').length)
		var curRating = "<div class='rating'>" + $('div#commentArea > div.rating').html().split('stars').join('') + "</div>";
		// find the div.rating that is in the comment area, take the string and remove the stars class from the string
		// to do: something more sophisticated to remove 'class' from the string if there is none 
	else
		var curRating = "<p>No rating</p>";
	var curComment = '<span class="cmtName">' + cName + ' says:' + '</span><p class="comment">' + cText + '</p>' + 'Rating:' + curRating + '<span class="date">' + Date() + '</span><br />' + prevComments;
	$('#commentList').empty();
	$('#commentList').append(curComment);
	$('.stars.starSelected').removeClass('starSelected');			// clear the remembered rating from the commenting area
	setObject('comments', $('#commentList').html());
}

function clearComment()
{
	if($("#commentBox").val() == "CLR STORAGE")
		clearStorage();
	$("#nameBox").val("");
	$("#commentBox").val("");
}

function fetchComments()
{
	var inList = getObject('comments');
	if (inList == null)
		inList = '<span class="cmtName">No comments</span>';
	$('#commentList').empty();
	$('#commentList').append(inList);
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