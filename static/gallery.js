$(document).ready
(
	function() 
	{
		$('#thumbnailSlider').carousel
		(
			{
				interval: 0
			}
		);
		
		$('#thumbnailSlider').on
		(
			'slid.bs.carousel', 
			function() 
			{
				
			}
		);   
	}
);

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

$("a.thumbnail").click
(
	function(event)
	{
		var mainImg = document.getElementById("fullSize");
		var thumbnail = this.firstChild;										// img attribute in a.thumbnail
		var index = parseInt(this.getAttribute("href").replace('#', '')) - 1;	// calculate index based on the href value of a.thumbnail
		mainImg.src = thumbnail.src;
		mainImg.setAttribute("longdesc", index);
	}
);

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
				mainImg.src = "static/img/" + imgList[index];
				$(mainImg).attr("longdesc", index);
				$(mainImg).attr("alt", "Image " + (index + 1));
			}
			
			if(selector === "prevImg")
			{
				if(index % 4 == 3)
				{
					// JavaScript is loosely typed, therefore the need to round up
					$('#thumbnailSlider').carousel((Math.floor(index / 4)));
				}
			}
			else
			{
				if(index % 4 == 0)
				{
					// items are 4 each, therefore the slider needs to go to index / 4
					$('#thumbnailSlider').carousel((index / 4));
				}
			}
		}
		else		// the slidebar could be overflown if desired; otherwise there is nothing else to do
		{
			
		}	
	}
);