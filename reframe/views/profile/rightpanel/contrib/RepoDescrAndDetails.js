import React from 'react';

import '../../../../browser/thirdparty/semantic-ui-2.3.2/accordion.min.css';

import Language from './Language';
import ProgressBar from './ProgressBar';
import './RepoDescrAndDetails.css';

const roundHalf = num => Math.round(num * 2) / 2;

class RepoDescrAndDetails extends React.Component {
  componentDidMount() {
    this.setupSemanticUi();
  }

  componentDidUpdate() {
    this.setupSemanticUi();
  }

  setupSemanticUi() {
    $('.ui.accordion').accordion();
  }

  render() {
    const humanReadablePercentage = val => {
      const result = roundHalf(val);
      if (result < 1) {
        return '< 1';
      }
      return `${result}`;
    };

    const languages = [];
    for (const language of Object.keys(this.props.languages)) {
      languages.push(<Language key={language} name={language}
                               color={this.props.languages[language].color} />);
    }
    for (const tech of this.props.techs) {
      languages.push(<Language key={tech} name={tech}
                               color="#ccc" />);
    }

    return (
      <div className="ui accordion">
        <div className="title p-0">
          <span className="text-gray">{this.props.descr}</span>
          <i className="dropdown icon text-gray mx-1"></i>
        </div>
        <div className="content">
          {
            Object.keys(languages).length > 0 &&
            <div>
              {languages}
              <a href="https://github.com/AurelienLourot/ghuser.io/blob/master/docs/repo-settings.md"
                 title="Add a tech" className="add-a-tech text-gray" target="_blank"><span className="add-a-tech-plus">+</span></a>
            </div> ||
            ''
          }
          <table>
            <tbody>
              <tr>
                <td className="contrib-details">user's contribution:</td>
                <td className="contrib-details">
                  <ProgressBar color="green" percentage={this.props.contrib.percentage} />
                </td>
                <td className="contrib-details">
                  // {humanReadablePercentage(this.props.contrib.percentage)} % of the project
                </td>
              </tr>
              <tr>
                <td className="contrib-details">project popularity:</td>
                <td className="contrib-details">
                  <ProgressBar color="green" percentage={this.props.contrib.popularity * 20} />
                </td>
                <td className="contrib-details">
                  // {roundHalf(this.props.contrib.popularity)} / 5
                  <span className="mx-2">( {this.props.strStars} )</span>
                </td>
              </tr>
              <tr>
                <td className="contrib-details">project activity:</td>
                <td className="contrib-details">
                  <ProgressBar color="green" percentage={this.props.contrib.activity * 20} />
                </td>
                <td className="contrib-details">
                  // {roundHalf(this.props.contrib.activity)} / 5
                  <span className="mx-2">({this.props.strLastPushed})</span>
                </td>
              </tr>
              <tr>
                <td className="contrib-details">project maturity:</td>
                <td className="contrib-details">
                  <ProgressBar color="green" percentage={this.props.contrib.maturity * 20} />
                </td>
                <td className="contrib-details">
                  // {roundHalf(this.props.contrib.maturity)} / 5
                  <span className="mx-2">({this.props.strNumCommits})</span>
                </td>
              </tr>
              <tr>
                <td className="contrib-details">contribution score:*</td>
                <td className="contrib-details">
                  <ProgressBar color="grey" percentage={this.props.contrib.total_score * 100 / this.props.contrib.max_total_score} />
                </td>
                <td className="contrib-details">
                  // {roundHalf(this.props.contrib.total_score)} / {this.props.contrib.max_total_score}
                  <span className="mx-2">&larr; {this.props.contrib.total_score_human_formula}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="contrib-details">(* all contributions on this page are sorted according to this score)</div>
        </div>
      </div>
    );
  }
}

export {
  roundHalf,
  RepoDescrAndDetails
};