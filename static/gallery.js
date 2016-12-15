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
		var thumbnail = this.firstChild;
		var index = parseInt(this.getAttribute("href").replace('#', '')) - 1;
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
					for(var i = 0; i < (index / 4); i++)
					{
						$('#thumbnailSlider').carousel('prev');
					}
				}
			}
			else
			{
				if(index % 4 == 0)
				{
					for(var i = 0; i < (index / 4); i++)
					{
						$('#thumbnailSlider').carousel('next');
					}
				}
			}
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
