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
import key from 'keymaster';
import GlobalNavSearchForm from './GlobalNavSearchForm';

type Props = {
  appState: { organizationsEnabled: boolean },
  currentUser: { isLoggedIn: boolean }
};

type State = {
  open: boolean
};

export default class GlobalNavSearch extends React.PureComponent {
  props: Props;
  state: State = { open: false };

  componentDidMount() {
    key('s', () => {
      this.setState({ open: true });
      return false;
    });
  }

  componentWillUnmount() {
    key.unbind('s');
  }

  openSearch = () => this.setState({ open: true });

  closeSearch = () => this.setState({ open: false });

  onClick = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.setState(state => ({ open: !state.open }));
  };

  render() {
    const dropdownClassName = 'dropdown' + (this.state.open ? ' open' : '');
    return (
      <li ref="dropdown" className={dropdownClassName}>
        <a className="navbar-search-dropdown" href="#" onClick={this.onClick}>
          <i className="icon-search navbar-icon" />&nbsp;<i className="icon-dropdown" />
        </a>
        {this.state.open &&
          <GlobalNavSearchForm
            appState={this.props.appState}
            currentUser={this.props.currentUser}
            onClose={this.closeSearch}
          />}
      </li>
    );
  }
}
