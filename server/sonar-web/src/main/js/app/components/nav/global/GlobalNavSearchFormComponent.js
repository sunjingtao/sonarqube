/*
 * SonarQube
 * Copyright (C) 2009-2017 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
// @flow
import React from 'react';
import { Link } from 'react-router';
import FavoriteIcon from '../../../../components/common/FavoriteIcon';
import QualifierIcon from '../../../../components/shared/QualifierIcon';
import ClockIcon from '../../../../components/common/ClockIcon';
import Tooltip from '../../../../components/controls/Tooltip';
import { getProjectUrl } from '../../../../helpers/urls';

export type Component = {
  isFavorite?: boolean,
  isRecentlyBrowsed?: boolean,
  key: string,
  match?: string,
  name: string,
  organization?: string,
  project?: string,
  qualifier: string
};

type Props = {|
  appState: { organizationsEnabled: boolean },
  component: Component,
  innerRef: HTMLElement => HTMLElement,
  onClose: () => void,
  onSelect: string => void,
  organizations: { [string]: { name: string } },
  projects: { [string]: { name: string } },
  selected: boolean
|};

export default class GlobalNavSearchFormComponent extends React.PureComponent {
  props: Props;

  handleMouseEnter = () => {
    this.props.onSelect(this.props.component.key);
  };

  renderOrganization = (component: Component) => {
    if (!this.props.appState.organizationsEnabled) {
      return null;
    }

    if (!['VW', 'SVW', 'TRK'].includes(component.qualifier) || component.organization == null) {
      return null;
    }

    const organization = this.props.organizations[component.organization];
    return organization ? <div className="pull-right text-muted-2">{organization.name}</div> : null;
  };

  renderProject = (component: Component) => {
    if (!['BRC', 'FIL', 'UTS'].includes(component.qualifier) || component.project == null) {
      return null;
    }

    const project = this.props.projects[component.project];
    return project ? <div className="pull-right text-muted-2">{project.name}</div> : null;
  };

  render() {
    const { component } = this.props;

    return (
      <li
        className={this.props.selected ? 'active' : undefined}
        key={component.key}
        ref={this.props.innerRef}>
        <Tooltip mouseEnterDelay={1.0} overlay={component.key} placement="left">
          <Link
            data-key={component.key}
            onClick={this.props.onClose}
            onMouseEnter={this.handleMouseEnter}
            to={getProjectUrl(component.key)}>

            {this.renderOrganization(component)}
            {this.renderProject(component)}

            <span className="navbar-search-item-icons little-spacer-right">
              {component.isFavorite && <FavoriteIcon favorite={true} size={12} />}
              {!component.isFavorite && component.isRecentlyBrowsed && <ClockIcon size={12} />}
              <QualifierIcon className="little-spacer-right" qualifier={component.qualifier} />
            </span>

            {component.match
              ? <span dangerouslySetInnerHTML={{ __html: component.match }} />
              : component.name}

          </Link>
        </Tooltip>
      </li>
    );
  }
}
