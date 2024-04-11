import frappe
from frappe.utils import cint

def boot_session(bootinfo):
	if frappe.session["user"] != "Guest":
		bootinfo.nepali_date_datepicker_format = frappe.db.get_single_value("Nepali Date Settings", "nepali_date_datepicker_format")
		bootinfo.nepali_date_format = frappe.db.get_single_value("Nepali Date Settings", "nepali_date_format")

def bootinfo(bootinfo):
	if frappe.session["user"] != "Guest":
		bootinfo.nepali_date_datepicker_format = frappe.db.get_single_value("Nepali Date Settings", "nepali_date_datepicker_format")
		bootinfo.nepali_date_format = frappe.db.get_single_value("Nepali Date Settings", "nepali_date_format")