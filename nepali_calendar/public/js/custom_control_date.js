import NepaliDate from 'nepali-date-converter';
const TYPE_DATE = 'date';
const TYPE_DATETIME = 'datetime';
const BS_DATE_FORMAT = frappe.boot['nepali_date_datepicker_format'] || 'mm-dd-yyyy';
const BS_DATE_FORMAT_USER = frappe.boot['nepali_date_format'] || 'MMM dd, yyyy';
const NPFORMATE_VALUES = {
    'mm-dd-yyyy': '%m-%d-%y',
    'mm.dd.yyyy': '%m.%d.%y',
    'mm/dd/yyyy': '%m/%d/%y',
    'dd-mm-yyyy': '%d-%m-%y',
    'dd.mm.yyyy': '%d.%m.%y',
    'dd/mm/yyyy': '%d/%m/%y',
    'yyyy-mm-dd': '%y-%m-%d',
    'yyyy/mm/dd': '%y/%m/%d',
    'yyyy.mm.dd': '%y.%m.%d',
};
import DataTable from "frappe-datatable";
const datetime_str_to_user = frappe.datetime.str_to_user;
const frappeDateFormatter = frappe.form.formatters.Date;
const frappeDatetimeFormatter = frappe.form.formatters.Datetime;

function FormatFormDate(value) {
    frappe.datetime.str_to_user = datetime_str_to_user;
    const formatted = frappeDateFormatter(value);

    if (!formatted) { return formatted; }
    const date = frappe.datetime.str_to_obj(value);
    let naplidate = new NepaliDate(new Date(date));
    let bs_date_formatted = naplidate.format(BS_DATE_FORMAT.toUpperCase(), 'np');
    return formatted + '<br />' + bs_date_formatted;
}

function FormatFormDatetime(value) {
    frappe.datetime.str_to_user = datetime_str_to_user;
    const formatted = frappeDatetimeFormatter(value);

    if (!formatted) { return formatted; }

    const date = frappe.datetime.str_to_obj(value);
    let naplidate = new NepaliDate(new Date(date));
    let bs_date_formatted = naplidate.format(BS_DATE_FORMAT.toUpperCase(), 'np');
    return formatted + '<br />' + bs_date_formatted;
}
frappe.ui.form.ControlDate = class CustomControlDate extends frappe.ui.form.ControlDate {
    make_input() {
        this.datepicker_bs = true;
        super.make_input();
        this.$npInput = this.$input.clone();
        this.$npInput.addClass('hide');
        // this.$npInput.removeAttr('data-fieldtype');
        // this.$npInput.removeAttr('data-fieldname');
        // this.show_default_nepali();
        this.npmake_picker();
        this._toggleDatepicker();
        frappe.form.formatters.Date = FormatFormDate;
        frappe.form.formatters.Datetime = FormatFormDatetime;
    }
    show_default_nepali(){
        this.datepicker_bs = true;
        this.$npInput.removeClass('hide');
        this.Input.adddClass('hide');
    }
    npmake_picker() {
        if (typeof $.nepaliDatePicker === 'function') {
            console.log("Your jQuery function is defined");
        }
        $(this.$npInput).nepaliDatePicker({
            dateFormat: NPFORMATE_VALUES[BS_DATE_FORMAT],
            ndpYear: true,
            ndpMonth: true,
            ndpYearCount: 10,
            closeOnDateSelect: true
        });
        var self = this;
        $(this.$npInput).on("dateSelect", function (event) {
            var datePickerData = event.datePickerData;

            var bsYear = datePickerData.bsYear;
            var bsMonth = datePickerData.bsMonth;
            var bsDate = datePickerData.bsDate;
            var actual_time = calendarFunctions.getAdDateByBsDate(bsYear, bsMonth, bsDate);
            var formattedDate = moment(actual_time).format(frappe.boot.sysdefaults.date_format.toUpperCase());
            self.$input.val(formattedDate);
            self.$input.trigger('change');
        });
        $(this.$npInput).removeAttr('readonly');
        this.$input.after(this.$npInput);
    }
    _toggleDatepicker(){
        if (!this.$npInput || !this.$npInput.length) { return; }
        if (this.datepicker_bs === true) {
            this.$npInput.removeClass('hide');
            this.$input.addClass('hide');
        } else {
            this.$input.removeClass('hide');
            this.$npInput.addClass('hide');
        }
        this._printDateConversion();
    }
    bind_events() {
        this.$wrapper.on('click', '.nd_switch_btn', (ev) => {
                event.preventDefault();
                event.stopPropagation();
                this.datepicker_bs = !this.datepicker_bs;
                this._toggleDatepicker();
        });
    }
    make_wrapper() {
        if (this.only_input) {
            this.$wrapper = $('<div class="form-group frappe-control nd_datepicker_multi ss"><span class="nd_switch_btn" title="Switch Calendar"></span>').appendTo(this.parent);
        } else {
            this.$wrapper = $(
                `<div class="frappe-control nd_datepickers_container">
                <div class="form-group">
                    <div class="clearfix">
                        <label class="control-label" style="padding-right: 0px;"></label>
                        <span class="help"></span>
                    </div>
                    <div class="control-input-wrapper nd_datepicker_multi aaa">
                        <div class="control-input"></div>
                        <span class="nd_switch_btn" title="Switch Calendar"></span>
                        <div class="control-value like-disabled-input" style="display: none;"></div>
                        <div class="nepali_date-conversion small bold" style="padding-left: 8px;">&nbsp;</div>
                        <p class="help-box small text-muted"></p>
                    </div>
                </div>
            </div>`
            ).appendTo(this.parent);
        }
        this.bind_events();
    }
    get_now_date() {
        return frappe.datetime
            .convert_to_system_tz(frappe.datetime.now_date(true), false)
            .toDate();
    }
    set_formatted_input(value) {
        const spset = super.set_formatted_input(value);
        if(value){
           let lpvalue = this.get_np_datepicker_format(value);
           this.$npInput.val(lpvalue);
           this._printDateConversion();
        }
        return spset;
    }
    ad2bs(m, type, dateFormat = BS_DATE_FORMAT){
        if (!m) { return null; }
        return this.ad2bs_date(m, type);
    }
    ad2bs_date(m, type = TYPE_DATE){
        let adDate;

        if (type == TYPE_DATETIME) {
            adDate = moment(m.clone().toDate(), 'YYYY-MM-DD HH:mm:ss').utc().toDate();
        } else {
            adDate = m.toDate();
        }
        let naplidate = new NepaliDate(adDate);
        return naplidate.format(BS_DATE_FORMAT_USER.toUpperCase(), 'np');
    }
    get_np_datepicker_format(value){
        const selectedDate = moment(value, this.date_format);
        let dateType;
        let adDate;
        if(this.df.fieldtype === 'Date') {
            dateType = TYPE_DATE;
        } else if (this.df.fieldtype === 'Datetime') {
            dateType = TYPE_DATETIME;
        }
        if (dateType == TYPE_DATETIME) {
            adDate = moment(selectedDate.clone().toDate(), 'YYYY-MM-DD HH:mm:ss').utc().toDate();
        } else {
            adDate = selectedDate.toDate();
        }
        let naplidate = new NepaliDate(adDate);
        return naplidate.format(BS_DATE_FORMAT.toUpperCase(), 'np');
    }
    _printDateConversion(){
        let value = this.get_value();
            let dateType;

            if(this.df.fieldtype === 'Date') {
                dateType = TYPE_DATE;
            } else if (this.df.fieldtype === 'Datetime') {
                dateType = TYPE_DATETIME;
            }

            if (!this.can_write()) {
                this.$wrapper.find('.nepali_date-conversion').html('&nbsp;');
                return;
            }

            if (!value) {
                this.$wrapper.find('.nepali_date-conversion').html('&nbsp;');
            } else {
                if (this.datepicker_bs) {
                    this.$wrapper.find('.nepali_date-conversion').html(value);
                } else {
                    const selectedDate = moment(value, this.date_format);

                    this.$wrapper.find('.nepali_date-conversion').html(
                        this.ad2bs(selectedDate, dateType, BS_DATE_FORMAT_USER)
                    );
                }
            }
    }
    refresh() {
        super.refresh();
        this._printDateConversion();
        if (!this.can_write()) {
            this.$wrapper.find('.nd_switch_btn').css('display', 'none');
        } else {
            this.$wrapper.find('.nd_switch_btn').css('display', 'block');
        }
    }
    set_np_date(value){

    }
};

frappe.ui.form.ControlDatetime = class CustomControlDateDate extends frappe.ui.form.ControlDatetime {
   make_input() {
        this.datepicker_bs = true;
        super.make_input();
        this.$npInput = this.$input.clone();
        this.$npInput.addClass('hide');
        this.npmake_picker();
        this._toggleDatepicker();
    }
    show_default_nepali(){
        this.datepicker_bs = true;
        this.$npInput.removeClass('hide');
        this.Input.adddClass('hide');
    }
    npmake_picker() {
        if (typeof $.nepaliDatePicker === 'function') {
            console.log("Your jQuery function is defined");
        }
        $(this.$npInput).nepaliDatePicker({
            dateFormat: NPFORMATE_VALUES[BS_DATE_FORMAT],
            ndpYear: true,
            ndpMonth: true,
            ndpYearCount: 10,
            closeOnDateSelect: true
        });
        var self = this;
        $(this.$npInput).on("dateSelect", function (event) {
            var datePickerData = event.datePickerData;

            var bsYear = datePickerData.bsYear;
            var bsMonth = datePickerData.bsMonth;
            var bsDate = datePickerData.bsDate;
            var actual_time = calendarFunctions.getAdDateByBsDate(bsYear, bsMonth, bsDate);
            var formattedDate = moment(actual_time).format(frappe.boot.sysdefaults.date_format.toUpperCase());
            self.$input.val(formattedDate);
            self.$input.trigger('change');
        });
        $(this.$npInput).removeAttr('readonly');
        this.$input.after(this.$npInput);
    }
    _toggleDatepicker(){
        if (!this.$npInput || !this.$npInput.length) { return; }
        if (this.datepicker_bs === true) {
            this.$npInput.removeClass('hide');
            this.$input.addClass('hide');
        } else {
            this.$input.removeClass('hide');
            this.$npInput.addClass('hide');
        }
        this._printDateConversion();
    }
    bind_events() {
        this.$wrapper.on('click', '.nd_switch_btn', (ev) => {
                event.preventDefault();
                event.stopPropagation();
                this.datepicker_bs = !this.datepicker_bs;
                this._toggleDatepicker();
        });
    }
    make_wrapper() {
        if (this.only_input) {
            this.$wrapper = $('<div class="form-group frappe-control nd_datepicker_multi ss"><span class="nd_switch_btn" title="Switch Calendar"></span>').appendTo(this.parent);
        } else {
            this.$wrapper = $(
                `<div class="frappe-control nd_datepickers_container">
                <div class="form-group">
                    <div class="clearfix">
                        <label class="control-label" style="padding-right: 0px;"></label>
                        <span class="help"></span>
                    </div>
                    <div class="control-input-wrapper nd_datepicker_multi aaa">
                        <div class="control-input"></div>
                        <span class="nd_switch_btn" title="Switch Calendar"></span>
                        <div class="control-value like-disabled-input" style="display: none;"></div>
                        <div class="nepali_date-conversion small bold" style="padding-left: 8px;">&nbsp;</div>
                        <p class="help-box small text-muted"></p>
                    </div>
                </div>
            </div>`
            ).appendTo(this.parent);
        }
        this.bind_events();
    }
    get_now_date() {
        return frappe.datetime
            .convert_to_system_tz(frappe.datetime.now_date(true), false)
            .toDate();
    }
    set_formatted_input(value) {
        const spset = super.set_formatted_input(value);
        if(value){
           let lpvalue = this.get_np_datepicker_format(value);
           this.$npInput.val(lpvalue);
           this._printDateConversion();
        }
        return spset;
    }
    ad2bs(m, type, dateFormat = BS_DATE_FORMAT){
        if (!m) { return null; }
        return this.ad2bs_date(m, type);
    }
    ad2bs_date(m, type = TYPE_DATE){
        let adDate;

        if (type == TYPE_DATETIME) {
            adDate = moment(m.clone().toDate(), 'YYYY-MM-DD HH:mm:ss').utc().toDate();
        } else {
            adDate = m.toDate();
        }
        let naplidate = new NepaliDate(adDate);
        return naplidate.format(BS_DATE_FORMAT_USER.toUpperCase(), 'np');
    }
    get_np_datepicker_format(value){
        const selectedDate = moment(value, this.date_format);
        let dateType;
        let adDate;
        if(this.df.fieldtype === 'Date') {
            dateType = TYPE_DATE;
        } else if (this.df.fieldtype === 'Datetime') {
            dateType = TYPE_DATETIME;
        }
        if (dateType == TYPE_DATETIME) {
            adDate = moment(selectedDate.clone().toDate(), 'YYYY-MM-DD HH:mm:ss').utc().toDate();
        } else {
            adDate = selectedDate.toDate();
        }
        let naplidate = new NepaliDate(adDate);
        return naplidate.format(BS_DATE_FORMAT.toUpperCase(), 'np');
    }
    _printDateConversion(){
        let value = this.get_value();
            let dateType;

            if(this.df.fieldtype === 'Date') {
                dateType = TYPE_DATE;
            } else if (this.df.fieldtype === 'Datetime') {
                dateType = TYPE_DATETIME;
            }

            if (!this.can_write()) {
                this.$wrapper.find('.nepali_date-conversion').html('&nbsp;');
                return;
            }

            if (!value) {
                this.$wrapper.find('.nepali_date-conversion').html('&nbsp;');
            } else {
                if (this.datepicker_bs) {
                    this.$wrapper.find('.nepali_date-conversion').html(value);
                } else {
                    const selectedDate = moment(value, this.date_format);

                    this.$wrapper.find('.nepali_date-conversion').html(
                        this.ad2bs(selectedDate, dateType, BS_DATE_FORMAT_USER)
                    );
                }
            }
    }
    refresh() {
        super.refresh();
        this._printDateConversion();
        if (!this.can_write()) {
            this.$wrapper.find('.nd_switch_btn').css('display', 'none');
        } else {
            this.$wrapper.find('.nd_switch_btn').css('display', 'block');
        }
    }
}


    function ReportFormatFormDate(value) {
        frappe.datetime.str_to_user = datetime_str_to_user;
        const formatted = frappeDateFormatter(value);

        if (!formatted) { return formatted; }
        const date = frappe.datetime.str_to_obj(value);
        let naplidate = new NepaliDate(new Date(date));
        let bs_date_formatted = naplidate.format(BS_DATE_FORMAT.toUpperCase(), 'np');
        return bs_date_formatted + '<br />' + formatted;
    }

    function ReportFormatFormDatetime(value) {
        frappe.datetime.str_to_user = datetime_str_to_user;
        const formatted = frappeDatetimeFormatter(value);

        if (!formatted) { return formatted; }

        const date = frappe.datetime.str_to_obj(value);
        let naplidate = new NepaliDate(new Date(date));
        let bs_date_formatted = naplidate.format(BS_DATE_FORMAT.toUpperCase(), 'np');
        return bs_date_formatted + '<br />' + formatted;
    }
class CustomDataTable extends DataTable {
    initializeComponents() {
        super.initializeComponents();
        const originalsetColumnHeaderWidth = this.columnmanager.setColumnHeaderWidth;
        const originalsetColumnWidth = this.columnmanager.setColumnWidth;
        this.columnmanager.setColumnHeaderWidth = function(colIndex) {
            originalsetColumnHeaderWidth.call(this, colIndex);
            var column = this.getColumn(colIndex);
            if(['Datetime', 'Date'].includes(column.fieldtype)){
                let $column = this.$columnMap[colIndex];
                $column.style.width = '300' + 'px';
            }
        };
        this.columnmanager.setColumnWidth = function(colIndex, width) {
            var column = this.getColumn(colIndex);
            if(['Datetime', 'Date'].includes(column.fieldtype)){
                width = '300';
            }
            originalsetColumnWidth.call(this, colIndex, width);
            
        };
        const originalgetCellContent = this.cellmanager.getCellContent;
        this.cellmanager.getCellContent = function(cell, refreshHtml = false) {
            var hcontent = originalgetCellContent.call(this, cell, refreshHtml);
            if(!cell.isHeader && !cell.isFilter && cell.column && cell.column.fieldtype != undefined && ['Date', 'Datetime'].includes(cell.column.fieldtype) && cell.content != undefined){
                if(cell.column.fieldtype == 'Date'){
                    cell.html = ReportFormatFormDate(cell.content);
                }
                if(cell.column.fieldtype == 'Datetime'){
                    cell.html = ReportFormatFormDatetime(cell.content);
                }
                hcontent = originalgetCellContent.call(this, cell, refreshHtml); 
            }
            return hcontent;
            
        };
    }
}
window.DataTable = CustomDataTable;
frappe.provide("frappe.views");
frappe.views.QueryReport = class CustomQueryReport extends frappe.views.QueryReport {
    init() {
        var def = super.init();
        return def;
    }
}
frappe.views.ReportView = class CustomReportView extends frappe.views.ReportView {
    setup_datatable(values) {
        this.$datatable_wrapper.empty();
        this.datatable = new window.DataTable(this.$datatable_wrapper[0], {
            columns: this.columns,
            data: this.get_data(values),
            getEditor: this.get_editing_object.bind(this),
            language: frappe.boot.lang,
            translations: frappe.utils.datatable.get_translations(),
            checkboxColumn: true,
            inlineFilters: true,
            cellHeight: 35,
            direction: frappe.utils.is_rtl() ? "rtl" : "ltr",
            events: {
                onRemoveColumn: (column) => {
                    this.remove_column_from_datatable(column);
                },
                onSwitchColumn: (column1, column2) => {
                    this.switch_column(column1, column2);
                },
                onCheckRow: () => {
                    const checked_items = this.get_checked_items();
                    this.toggle_actions_menu_button(checked_items.length > 0);
                },
            },
            hooks: {
                columnTotal: frappe.utils.report_column_total,
            },
            headerDropdown: [
                {
                    label: __("Add Column"),
                    action: (datatabe_col) => {
                        let columns_in_picker = [];
                        const columns = this.get_columns_for_picker();

                        columns_in_picker = columns[this.doctype]
                            .filter((df) => !this.is_column_added(df))
                            .map((df) => ({
                                label: __(df.label, null, df.parent),
                                value: df.fieldname,
                            }));

                        delete columns[this.doctype];

                        for (let cdt in columns) {
                            columns[cdt]
                                .filter((df) => !this.is_column_added(df))
                                .map((df) => ({
                                    label: __(df.label, null, df.parent) + ` (${cdt})`,
                                    value: df.fieldname + "," + cdt,
                                }))
                                .forEach((df) => columns_in_picker.push(df));
                        }

                        const d = new frappe.ui.Dialog({
                            title: __("Add Column"),
                            fields: [
                                {
                                    label: __("Select Column"),
                                    fieldname: "column",
                                    fieldtype: "Autocomplete",
                                    options: columns_in_picker,
                                },
                                {
                                    label: __("Insert Column Before {0}", [
                                        __(datatabe_col.docfield.label).bold(),
                                    ]),
                                    fieldname: "insert_before",
                                    fieldtype: "Check",
                                },
                            ],
                            primary_action: ({ column, insert_before }) => {
                                if (!columns_in_picker.map((col) => col.value).includes(column)) {
                                    frappe.show_alert({
                                        message: __("Invalid column"),
                                        indicator: "orange",
                                    });
                                    d.hide();
                                    return;
                                }

                                let doctype = this.doctype;
                                if (column.includes(",")) {
                                    [column, doctype] = column.split(",");
                                }

                                let index = datatabe_col.colIndex;
                                if (insert_before) {
                                    index = index - 1;
                                }

                                this.add_column_to_datatable(column, doctype, index);
                                d.hide();
                            },
                        });

                        d.show();
                    },
                },
            ],
        });
    }
}