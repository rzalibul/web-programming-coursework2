$(document).ready
(
	function()
	{
		$('div#contentWrap').append('<div id="bookingsCalendar"></div>');
		var widget = $('div#bookingsCalendar').datepicker({dateFormat: "yyyy-mm-dd"});
		$('div#bookingsCalendar').datepicker('setDate', '2016-12-18');
	}
);