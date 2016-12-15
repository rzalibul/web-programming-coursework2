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
				//var curComment = '<div id="cmt_' + cmtList.id + '"><span class="cmtName">' + cmtList.author + ' says:' + '</span><p class="comment">' + cmtList.comment + '</p>' + 'Rating:' + curRating + '<span class="date">' + cmtList.date + '</span><button class="cmtBtn" value="Modify" onclick="modifyComment(' + cmtList.id + ')">Modify</button><button class="cmtBtn" value="Delete" onclick="deleteComment(' + cmtList.id + ')">Delete</button></div>' + prevComments;
                
                var curComment ='<div class="container"><div class="panel panel-default"><div class="panel-heading">'+ curRating + ' ' + cmtList.author + ' on ' + cmtList.date +'</div><div class="panel-body"><p>' + cmtList.comment + '</p><button type="button" class="btn btn-default pull-right" onclick="modifyComment(' + cmtList.id + ')>Delete</button><button type="button" class="btn btn-default pull-right" onclick="modifyComment(' + cmtList.id + ')>Modify</button></div></div></div>' + prevComments;
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

function modifyComment(event, id)
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
		var newCmtArea = '<form id="modCmt_' + id + '" class="reviewForm" action="/modifyComment" method="post" role="form"><textarea class="form-control commentBox" name="comment" placeholder="Enter your comment..."></textarea><br />Your rating (if applicable): <div class="rating"><span class="stars">&#9734;</span><span class="stars">&#9734;</span><span class="stars">&#9734;</span><span class="stars">&#9734;</span><span class="stars">&#9734;</span></div><input class="hiddenRating" name="rating" type="number" hidden /></form>'
		$(event).prev().prev().html(newCmtArea);			// modify the selector to the comment area for modifying comments
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
					var curComment = '<span class="cmtName">' + modifiedCmt.author + ' says:' + '</span><p class="comment">' + modifiedCmt.comment + '</p>' + 'Rating:' + curRating + '<span class="date">' + modifiedCmt.date + '</span><button class="cmtBtn" value="Modify" onclick="modifyComment(this,' + modifiedCmt.id + ')">Modify</button><button class="cmtBtn" value="Delete" onclick="deleteComment(this,' + modifiedCmt.id + ')">Delete</button>';
					
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

function deleteComment(event, id)
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
                        /*
						comments += '<div id="cmt_' + val.id + '"><span class="cmtName">' + val.author + ' says:' + '</span><p class="comment">' + val.comment + '</p>' + 'Rating:' + curRating + '<span class="date">' + val.date + '</span><button class="cmtBtn" value="Modify" onclick="modifyComment(' + val.id + ')">Modify</button><button class="cmtBtn" value="Delete" onclick="deleteComment(' + val.id + ')">Delete</button></div>';
                        */
                        comments += '<div class="container"><div class="panel panel-default"><div class="panel-heading">'+ curRating + ' ' + val.author + ' on ' + val.date +'</div><div class="panel-body"><p>' + val.comment + '</p><button type="button" class="btn btn-default pull-right" onclick="deleteComment(this,' + val.id + ')">Delete</button><button type="button" class="btn btn-default pull-right" onclick="modifyComment(this,' + val.id + ')">Modify</button></div></div></div>';
                        
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

/* booking functionality */

function estimateBooking(event)
{
	if (!$('form.bookingEntry > span#estimate').length)	// check whether the span element is present in the form
	{
		event.preventDefault();								// stop the form from automatic submission
		$.ajax
		(
			{
				url: '/estimateBooking',
				data: 'arrDate=' + $('input[name="arrival"]').val() + '&depDate=' + $('input[name="departure"]').val(),
				type: 'GET',
				success: function(response)
				{
					var bookingStatus = JSON.parse(response);
					if(bookingStatus.status == "OK")
					{
						$('form.bookingEntry > input[type="submit"]').attr('value', 'Submit');
						$('form.bookingEntry').append("<span id='estimate'>Current estimate = £" + bookingStatus.estimate + "</span>");
					}
					else
					{
						console.log(response);
					}
				},
				error: function(response)
				{
					console.log(response);
				}
			}
		);

		return false;
	}
	else
	{
		return true;
	}
}

function modifyBooking(id)
{
	
}

function deleteBooking(id)
{
	var response = confirm('Are you sure you want to delete this booking request?');
	if(response)
	{
		$.ajax
		(
			{
				url: '/deleteBooking',
				data: 'booking_id=' + id,
				type: 'POST',
				success: function(response)
				{
					response = JSON.parse(response);
					if(response.status == "OK")
					{
						$('tr#booking_' + id).remove();
						alert('Booking removed!');
					}
				},
				error: function(response)
				{
					
				}
			}
		);
	}
}