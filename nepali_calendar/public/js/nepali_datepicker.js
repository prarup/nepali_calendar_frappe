(function () {

    class CalendarViewExtended extends frappe.views.CalendarView {
        get required_libs() {
            var libs = super.required_libs;

            //@NOTE: to include assets directrly from source without building
            // libs.push('assets/nepali_date/js/fullcalendar-bs.js');

            libs.push('assets/js/fullcalendar-bs.min.js');

            return libs;
        }
    }

    frappe.views.CalendarView = CalendarViewExtended;

}());

(function () {

    const TYPE_DATE = 'date';
    const TYPE_DATETIME = 'datetime';
    const BS_DATE_FORMAT = frappe.boot['nepali_date_datepicker_format'] || 'mm-dd-yyyy';
    const BS_DATE_FORMAT_USER = frappe.boot['nepali_date_format'] || 'MMM dd, yyyy';
    const BS_DATE_REPORT_OPTION = frappe.boot['nepali_date_report_option'] || 'Both'

    const AbstractControlDateBS = {
        /**
         * @private
         */
            _toggleDatepicker: function () {

            if (!this.$input_bs || !this.$input_bs.length) { return; }

            if (this.datepicker_bs === true) {
                this.$input_bs.removeClass('hide');
                this.$input.addClass('hide');
            } else {
                this.$input.removeClass('hide');
                this.$input_bs.addClass('hide');
            }

            this._printDateConversion();
        },

        /**
         * @private
         */
        _printDateConversion: function () {
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
                        ad2bs(selectedDate, dateType, BS_DATE_FORMAT_USER)
                    );
                }
            }
        },

        /**
         * @private
         */
        onBSDateSelect: function ([cdate]) {
            let currentValue = this.get_value();
            let timeInfo;
            
            if (currentValue) {
                const dateTime = moment(frappe.datetime.str_to_obj(currentValue));
                timeInfo = {
                    hours: dateTime.hours(),
                    minutes: dateTime.minutes(),
                    seconds: dateTime.seconds(),
                };
            }
            
            let selected_date = cdate && moment(cdate.toJSDate()) || undefined;

            if (selected_date && timeInfo) {
                selected_date.set(timeInfo);
            }

            if (selected_date && moment(this.get_value(), this.date_format).isSame(selected_date)) {
                return;
            }

            this.set_value(selected_date.format(this.date_format));
        },

        /**
         * @private
         */
        onBSDatepickerClose: function ([cdate]) {
            this.onBSDateSelect([cdate]);
            this.$input_bs.blur();
        },

        /**
         * @private
         */

        set_input_bs_attributes: function () {
            this.$input_bs
                .attr("data-fieldtype", this.df.fieldtype)
                .attr("data-fieldname", this.df.fieldname)
                .attr("placeholder", this.df.placeholder || "");
            if (this.doctype) {
                this.$input_bs.attr("data-doctype", this.doctype);
            }
            if (this.df.input_css) {
                this.$input_bs.css(this.df.input_css);
            }
            if (this.df.input_class) {
                this.$input_bs.addClass(this.df.input_class);
            }
        },

        /**@override */
        init: function (opts) {
            this._super.apply(this, arguments);
            this.datepicker_bs = true;
        },

        /**
         * @override
         */
        make_wrapper: function () {
            if (this.only_input) {
                this.$wrapper = $('<div class="form-group frappe-control nd_datepicker_multi"><span class="nd_switch_btn aaa" title="Switch Calendar" /></div>').appendTo(this.parent);
            } else {
                this.$wrapper = $('<div class="frappe-control nd_datepickers_container">\
                    <div class="form-group">\
                        <div class="clearfix">\
                            <label class="control-label" style="padding-right: 0px;"></label>\
                        </div>\
                        <div class="control-input-wrapper nd_datepicker_multi">\
                            <div class="control-input"></div>\
                            <span class="nd_switch_btn vbbb" title="Switch Calendar" /> \
                            <div class="control-value like-disabled-input" style="display: none;"></div>\
                            <div class="nepali_date-conversion small bold" style="padding-left: 8px;">&nbsp;</div> \
                            <p class="help-box small text-muted hidden-xs"></p>\
                        </div>\
                    </div>\
                </div>').appendTo(this.parent);
            }

            this.bind_events();
        },

        /**
         * @private
         */
        bind_events: function () {
            this.$wrapper.on('click', '.nd_switch_btn', () => {
                this.datepicker_bs = !this.datepicker_bs;
                this._toggleDatepicker();
            });
        },

        /**
         * @override
         */
        make_input: function () {
            if (this.$input_bs) return;

            this.$input_bs = $("<" + this.html_element + ">")
                .attr("type", this.input_type)
                .attr("autocomplete", "off")
                .addClass("input-with-feedback form-control")
                .prependTo(this.input_area);

            if (in_list(['Data', 'Link', 'Dynamic Link', 'Password', 'Select', 'Read Only', 'Attach', 'Attach Image'],
                this.df.fieldtype)) {
                this.$input_bs.attr("maxlength", this.df.length || 140);
            }

            this.input_bs = this.$input_bs.get(0);
            this.has_input_bs = true;
            // this.bind_change_event();
            // this.setup_autoname_check();

            this._super.apply(this, arguments);

            this._toggleDatepicker();
        },

        /**
         * @override
         */
        set_input_attributes: function () {
            this._super.apply(this, arguments);
            this.set_input_bs_attributes();
        },

        /**
         * @override
         */
        set_bold: function () {
            this._super.apply(this, arguments);
            if (this.$input_bs) {
                this.$input_bs.toggleClass("bold", !!(this.df.bold || this.df.reqd));
            }
        },

        /**
         * @override
         */
        set_datepicker: function () {
            this._super.apply(this, arguments);

            this.$input_bs.calendarsPicker('destroy');
            this.$input_bs.calendarsPicker({
                showAnim: '',
                prevText: '',
                nextText: '',
                firstDay: 0,
                // defaultDate: ad2bs(this.get_value(), TYPE_DATE),
                dateFormat: BS_DATE_FORMAT,
                yearRange: 'c-55:c+5',
                calendar: getBSCalendar(),
                onSelect: this.onBSDateSelect.bind(this),
                onClose: this.onBSDatepickerClose.bind(this),
                commands: {
                    today: Object.assign({}, $.calendarsPicker.commands.today, {
                        action: function (inst) {
                            var today = moment(frappe.datetime.nowdate());
                            const todayBs = ad2bs_date(today);

                            inst.elem
                                .calendarsPicker('showMonth', todayBs.year(), todayBs.month())
                                .calendarsPicker('setDate', todayBs);
                        }
                    })
                }
            });
        },

        /**
         * @override
         */
        set_input: function (value) {
            this._super.apply(this, arguments);

            if (value) {
                let m = moment(frappe.datetime.str_to_obj(value));
                this.$input_bs.val(ad2bs(m) || '');
            } else {
                this.$input_bs.val('');
            }
            this._printDateConversion();
        },

        /**
         * @override
         */
        refresh() {
            this._super.apply(this, arguments);
            this._printDateConversion();

            if (!this.can_write()) {
                this.$wrapper.find('.nd_switch_btn').css('display', 'none');
            } else {
                this.$wrapper.find('.nd_switch_btn').css('display', 'block');
            }
        },
    };

    frappe.ui.form.ControlDate = frappe.ui.form.ControlDate.extend(AbstractControlDateBS);
    frappe.ui.form.ControlDatetime = frappe.ui.form.ControlDatetime.extend(AbstractControlDateBS);

    const datetime_str_to_user = frappe.datetime.str_to_user;
    const frappeDateFormatter = frappe.form.formatters.Date;
    const frappeDatetimeFormatter = frappe.form.formatters.Datetime;

    function convert_datetime_str_to_user(val, only_time) {
        const result = datetime_str_to_user(val, only_time);

        if (only_time) {
            return result;
        }

        if (
            only_time
            ||
            BS_DATE_REPORT_OPTION.toLowerCase() === 'a.d.'
            ||
            !result
        ) {
            return result;
        }

        const date = frappe.datetime.str_to_obj(val);

        const bs_date_formatted = ad2bs(moment(date), TYPE_DATE, BS_DATE_FORMAT_USER);

        if (BS_DATE_REPORT_OPTION.toLowerCase() === 'b.s.') {
            return bs_date_formatted;
        }

        return result + " (" + bs_date_formatted + " BS)"
    }

    function FormatFormDate(value) {
        frappe.datetime.str_to_user = datetime_str_to_user;
        const formatted = frappeDateFormatter(value);

        if (!formatted) { return formatted; }

        const date = frappe.datetime.str_to_obj(value);
        const bs_date_formatted = ad2bs(moment(date), TYPE_DATE, BS_DATE_FORMAT_USER);

        return formatted + '<br />' + bs_date_formatted;
    }

    function FormatFormDatetime(value) {
        frappe.datetime.str_to_user = datetime_str_to_user;
        const formatted = frappeDatetimeFormatter(value);

        if (!formatted) { return formatted; }

        const date = frappe.datetime.str_to_obj(value);
        const bs_date_formatted = ad2bs(moment(date), TYPE_DATETIME, BS_DATE_FORMAT_USER);

        return formatted + '<br />' + bs_date_formatted;
    }

    frappe.form.formatters.Date = FormatFormDate;
    frappe.form.formatters.Datetime = FormatFormDatetime;


    function FormatDateReport(value) {
        frappe.datetime.str_to_user = datetime_str_to_user;
        const formatted = frappeDateFormatter(value);

        if (BS_DATE_REPORT_OPTION.toLowerCase() === 'a.d.') {
            return formatted;
        }

        if (!formatted) { return formatted; }
        const date = frappe.datetime.str_to_obj(value);
        const bs_date_formatted = ad2bs(moment(date), TYPE_DATE, BS_DATE_FORMAT_USER);

        if (BS_DATE_REPORT_OPTION.toLowerCase() === 'b.s.') {
            return bs_date_formatted;
        }

        return formatted + '<br />' + '(' + bs_date_formatted + ' BS)';
    }

    function FormatDatetimeReport(value) {
        frappe.datetime.str_to_user = datetime_str_to_user;
        const formatted = frappeDatetimeFormatter(value);

        if (BS_DATE_REPORT_OPTION.toLowerCase() === 'a.d.') {
            return formatted;
        }

        if (!formatted) { return formatted; }
        const date = frappe.datetime.str_to_obj(value);
        const bs_date_formatted = ad2bs(moment(date), TYPE_DATETIME, BS_DATE_FORMAT_USER);

        if (BS_DATE_REPORT_OPTION.toLowerCase() === 'b.s.') {
            return bs_date_formatted + ' ' + value.split(' ').pop();
        }

        return formatted + '<br />' + '(' + bs_date_formatted + ' BS)';
    }

    class ExtendedReportView extends frappe.views.ReportView {
        setup_datatable(values) {
            super.setup_datatable(values);

            // this.datatable.buildOptions({
            //     cellHeight: 45,
            // });
            // this.datatable.render();
            // this.datatable.setDimensions();


            if (this.datatable) {
                $(this.datatable.wrapper).empty();
                this.datatable.buildOptions({
                    cellHeight: 45,
                });
                this.datatable.prepare();
                this.datatable.initializeComponents();
                this.datatable.refresh(this.get_data(this.data), this.columns);
                this.datatable.columnmanager.applyDefaultSortOrder();
            }
        }
    }

    frappe.views.ReportView = ExtendedReportView;

    class ExtendedQueryReport extends frappe.views.QueryReport {

        render_datatable() {
            super.render_datatable();

            if (this.datatable) {
                let columns = this.columns.filter((col) => !col.hidden);
                $(this.datatable.wrapper).empty();
                this.datatable.buildOptions({
                    cellHeight: 45,
                });
                this.datatable.prepare();
                this.datatable.initializeComponents();
                this.datatable.refresh(this.data, columns);
                // this.datatable.columnmanager.applyDefaultSortOrder();
            }
        }

        get_filters_html_for_print() {

            if (BS_DATE_REPORT_OPTION.toLowerCase() === 'a.d.') {
                return super.get_filters_html_for_print();
            }

            const applied_filters = this.get_filter_values();
            return Object.keys(applied_filters)
                .map(fieldname => {
                    const df = frappe.query_report.get_filter(fieldname).df;
                    let value = applied_filters[fieldname];

                    if (df.fieldtype === 'Date') {
                        const adDate = frappe.datetime.str_to_obj(value);
                        const bsDate = ad2bs(moment(adDate), TYPE_DATE, BS_DATE_FORMAT_USER);

                        if (BS_DATE_REPORT_OPTION.toLowerCase() === 'b.s.') {
                            value = bsDate;
                        } else {
                            value = `${value} (${bsDate} BS)`;
                        }
                    }

                    return `<h6>${__(df.label)}: ${value}</h6>`;
                })
                .join('');
        }

        pdf_report(print_settings) {
            
            frappe.datetime.str_to_user = convert_datetime_str_to_user;
            frappe.form.formatters.Date = FormatDateReport;
            frappe.form.formatters.Datetime = FormatDatetimeReport;

            try {
                const ret = super.pdf_report(print_settings);
                return ret;
            } catch (error) {
                throw error;
            } finally {
                frappe.datetime.str_to_user = datetime_str_to_user;
                frappe.form.formatters.Date = FormatFormDate;
                frappe.form.formatters.Datetime = FormatFormDatetime;
            }
        }

        print_report(print_settings) {
            frappe.datetime.str_to_user = convert_datetime_str_to_user;
            frappe.form.formatters.Date = FormatDateReport;
            frappe.form.formatters.Datetime = FormatDatetimeReport;

            try {
                const ret = super.print_report(print_settings);
                return ret;
            } catch (error) {
                throw error;
            } finally {
                frappe.datetime.str_to_user = datetime_str_to_user;
                frappe.form.formatters.Date = FormatFormDate;
                frappe.form.formatters.Datetime = FormatFormDatetime;
            }
        }

        get_data_for_csv(include_indentation) {
            const rows = this.datatable.bodyRenderer.visibleRows;
            if (this.raw_data.add_total_row) {
                rows.push(this.datatable.bodyRenderer.getTotalRow());
            }
            return rows.map(row => {
                const standard_column_count = this.datatable.datamanager.getStandardColumnCount();
                return row
                    .slice(standard_column_count)
                    .map((cell, i) => {
                        if (cell.column.fieldtype === "Duration") {
                            cell.content = frappe.utils.get_formatted_duration(cell.content);
                        }

                        if(cell.column.fieldtype === 'Date' && cell.content) {
                            cell.content = convert_datetime_str_to_user(cell.content);
                        }
                        
                        if (include_indentation && i===0) {
                            cell.content = '   '.repeat(row.meta.indent) + (cell.content || '');
                        }
                        return cell.content || '';
                    });
            });
        }

    }

    frappe.views.QueryReport = ExtendedQueryReport;

    function getBSCalendar() {
        return $.calendars.instance('nepali', 'en_US');
    }

    function ad2bs(m, type, dateFormat = BS_DATE_FORMAT) {
        if (!m) { return null; }

        return ad2bs_date(m, type).formatDate(dateFormat);
    }

    function ad2bs_date(m, type = TYPE_DATE) {
        let adDate;

        if (type == TYPE_DATETIME) {
            adDate = moment(m.clone().toDate(), 'YYYY-MM-DD HH:mm:ss').utc().toDate();
        } else {
            adDate = m.toDate();
        }

        return getBSCalendar().fromJSDate(adDate);
    }
}());