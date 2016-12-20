import React from 'react';

var NOT_STARTED = 0,
    PROCESSING =1,
    READY = 2;

export default class TableDownload extends React.Component {
    constructor() {
        super();

        this.state = {
            download: NOT_STARTED,
            download_link: null
        };
    }

    startPoll() {
        setTimeout(() => {
            this.checkStatus();
        }, 1000);
    }

    checkStatus() {
        $.ajax('/api/tables/'+this.props.table, {
            dataType: 'json',
            success: (data, status, xhr) => {
                if (data.table_file.file) {
                    this.setState({
                        download: READY,
                        download_link: data.table_file.file
                    });
                } else {
                    this.startPoll();
                }
            },
            error: (xhr, status, error) => {
                console.error(error);
            }
        });
    }

    requestDownload = () => {
        $.ajax('/admin/tables/download/'+this.props.table, {
            dataType: 'json',
            success: (data, status, xhr) => {
                this.setState({
                    download: PROCESSING
                });
                this.checkStatus();
            },
            error: (xhr, status, error) => {
                console.error(error);
            }
        });
    }

    render() {
        if (this.state.download == NOT_STARTED) {
            return <a href="#" className="button button-secondary" onClick={this.requestDownload}>Request Download</a>;
        } else if (this.state.download == PROCESSING) {
            return <a href="#" className="button button-secondary disabled">Layer Processing...</a>;
        } else {
            return <a href={this.state.download_link} className="button button-secondary">Download Table</a>;
        }
    }
}
