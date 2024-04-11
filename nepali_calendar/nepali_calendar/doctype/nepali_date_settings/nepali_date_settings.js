// Copyright (c) 2024, kanakinfosystems LLP and contributors
// For license information, please see license.txt

frappe.ui.form.on("Nepali Date Settings", {
	refresh(frm) {
		frappe.boot.nepali_date_datepicker_format = frm.doc.nepali_date_datepicker_format;
		frappe.boot.nepali_date_format = frm.doc.nepali_date_format;
	},
});
