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
import { debounce, groupBy, keyBy, sortBy, uniqBy } from 'lodash';
import GlobalNavSearchFormComponent from './GlobalNavSearchFormComponent';
import type { Component } from './GlobalNavSearchFormComponent';
import RecentHistory from '../../RecentHistory';
import { getSuggestions } from '../../../../api/components';
import { getFavorites } from '../../../../api/favorites';
import { translate } from '../../../../helpers/l10n';
import { scrollToElement } from '../../../../helpers/scrolling';
import { getProjectUrl } from '../../../../helpers/urls';

type Props = {|
  appState: { organizationsEnabled: boolean },
  currentUser: { isLoggedIn: boolean },
  onClose: () => void
|};

type State = {
  loading: boolean,
  loadingMore: ?string,
  more: { [string]: number },
  organizations: { [string]: { name: string } },
  projects: { [string]: { name: string } },
  query: string,
  results: { [qualifier: string]: Array<Component> },
  selected: ?string
};

const ORDER = ['DEV', 'VW', 'SVW', 'TRK', 'BRC', 'FIL', 'UTS'];

export default class GlobalNavSearchForm extends React.PureComponent {
  mounted: boolean;
  node: HTMLElement;
  nodes: { [string]: HTMLElement };
  props: Props;
  state: State;

  static contextTypes = {
    router: React.PropTypes.object
  };

  constructor(props: Props) {
    super(props);
    this.nodes = {};
    this.search = debounce(this.search, 250);
    this.state = {
      loading: false,
      loadingMore: null,
      more: {},
      organizations: {},
      projects: {},
      query: '',
      results: {},
      selected: null
    };
  }

  componentDidMount() {
    this.mounted = true;
    window.addEventListener('click', this.handleClickOutside);
    if (this.props.currentUser.isLoggedIn) {
      this.fetchFavorites();
    }
  }

  componentWillUpdate() {
    this.nodes = {};
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.selected !== this.state.selected) {
      this.scrollToSelected();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    window.removeEventListener('click', this.handleClickOutside);
  }

  handleClickOutside = (event: { target: HTMLElement }) => {
    if (!this.node.contains(event.target)) {
      this.props.onClose();
    }
  };

  getPlainComponentsList = (results: { [qualifier: string]: Array<Component> }): Array<Component> =>
    this.sortQualifiers(Object.keys(results)).reduce(
      (components, qualifier) => [...components, ...results[qualifier]],
      []
    );

  mergeWithRecentlyBrowsed = (components: Array<Component>) => {
    const recentlyBrowsed = RecentHistory.get().map(component => ({
      ...component,
      isRecentlyBrowsed: true,
      qualifier: component.icon.toUpperCase()
    }));
    return uniqBy([...components, ...recentlyBrowsed], 'key');
  };

  fetchFavorites = () => {
    this.setState({ loading: true });
    getFavorites().then(response => {
      const results = groupBy(
        this.mergeWithRecentlyBrowsed(
          response.favorites.map(component => ({ ...component, isFavorite: true }))
        ),
        'qualifier'
      );
      const list = this.getPlainComponentsList(results);
      this.setState({
        loading: false,
        more: {},
        results,
        selected: list.length > 0 ? list[0].key : null
      });
    });
  };

  search = (query: string) => {
    this.setState({ loading: true });
    const recentlyBrowsed = RecentHistory.get().map(component => component.key);
    getSuggestions(query, recentlyBrowsed).then(response => {
      const results = {};
      const more = {};
      response.results.forEach(group => {
        results[group.q] = group.items.map(item => ({ ...item, qualifier: group.q }));
        more[group.q] = group.more;
      });
      const list = this.getPlainComponentsList(results);
      this.setState(state => ({
        loading: false,
        more,
        organizations: { ...state.organizations, ...keyBy(response.organizations, 'key') },
        projects: { ...state.projects, ...keyBy(response.projects, 'key') },
        results,
        selected: list.length > 0 ? list[0].key : null
      }));
    });
  };

  searchMore = (qualifier: string) => {
    this.setState({ loading: true, loadingMore: qualifier });
    const recentlyBrowsed = RecentHistory.get().map(component => component.key);
    getSuggestions(this.state.query, recentlyBrowsed, qualifier).then(response => {
      const group = response.results.find(group => group.q === qualifier);
      const moreResults = (group ? group.items : []).map(item => ({ ...item, qualifier }));
      this.setState(state => ({
        loading: false,
        loadingMore: null,
        more: { ...state.more, [qualifier]: 0 },
        organizations: { ...state.organizations, ...keyBy(response.organizations, 'key') },
        projects: { ...state.projects, ...keyBy(response.projects, 'key') },
        results: {
          ...state.results,
          [qualifier]: uniqBy([...state.results[qualifier], ...moreResults], 'key')
        }
      }));
    });
  };

  handleQueryChange = (event: { currentTarget: HTMLInputElement }) => {
    const query = event.currentTarget.value;
    this.setState({ query });
    if (query.length === 0) {
      this.fetchFavorites();
    } else if (query.length >= 2) {
      this.search(query);
    }
  };

  selectPrevious = () => {
    this.setState((state: State) => {
      const list = this.getPlainComponentsList(state.results);
      const index = list.findIndex(component => component.key === state.selected);
      return index > 0 ? { selected: list[index - 1].key } : undefined;
    });
  };

  selectNext = () => {
    this.setState((state: State) => {
      const list = this.getPlainComponentsList(state.results);
      const index = list.findIndex(component => component.key === state.selected);
      return index >= 0 && index < list.length - 1 ? { selected: list[index + 1].key } : undefined;
    });
  };

  openSelected = () => {
    if (this.state.selected) {
      this.context.router.push(getProjectUrl(this.state.selected));
      this.props.onClose();
    }
  };

  scrollToSelected = () => {
    if (this.state.selected) {
      const node = this.nodes[this.state.selected];
      if (node) {
        scrollToElement(node, { topOffset: 30, bottomOffset: 30, parent: this.node });
      }
    }
  };

  handleKeyDown = (event: KeyboardEvent) => {
    switch (event.keyCode) {
      case 13:
        event.preventDefault();
        this.openSelected();
        return;
      case 27:
        event.preventDefault();
        this.props.onClose();
        return;
      case 38:
        event.preventDefault();
        this.selectPrevious();
        return;
      case 40:
        event.preventDefault();
        this.selectNext();
        return;
    }
  };

  handleSelect = (selected: string) => {
    this.setState({ selected });
  };

  handleMoreClick = (event: MouseEvent & { currentTarget: HTMLElement }) => {
    event.preventDefault();
    event.currentTarget.blur();
    const { qualifier } = event.currentTarget.dataset;
    this.searchMore(qualifier);
  };

  sortQualifiers = (qualifiers: Array<string>) =>
    sortBy(qualifiers, qualifier => ORDER.indexOf(qualifier));

  renderComponent = (component: Component) => (
    <GlobalNavSearchFormComponent
      appState={this.props.appState}
      component={component}
      innerRef={node => (this.nodes[component.key] = node)}
      key={component.key}
      onClose={this.props.onClose}
      onSelect={this.handleSelect}
      organizations={this.state.organizations}
      projects={this.state.projects}
      selected={this.state.selected === component.key}
    />
  );

  renderComponents = () => {
    const qualifiers = Object.keys(this.state.results);
    const renderedComponents = [];

    this.sortQualifiers(qualifiers).forEach(qualifier => {
      const components = this.state.results[qualifier];

      if (components.length > 0 && renderedComponents.length > 0) {
        renderedComponents.push(<li key={`divider-${qualifier}`} className="divider" />);
      }

      if (components.length > 0) {
        renderedComponents.push(
          <li key={`header-${qualifier}`} className="dropdown-header">
            {translate('qualifiers', qualifier)}
          </li>
        );
      }

      components.forEach(component => {
        renderedComponents.push(this.renderComponent(component));
      });

      const more = this.state.more[qualifier];
      if (more != null && more > 0) {
        renderedComponents.push(
          <li key={`more-${qualifier}`} className="menu-footer">
            {this.state.loadingMore === qualifier
              ? <i className="spinner" />
              : <a data-qualifier={qualifier} href="#" onClick={this.handleMoreClick}>
                  Show More
                </a>}
          </li>
        );
      }
    });

    return renderedComponents;
  };

  render() {
    return (
      <div
        className="dropdown-menu dropdown-menu-right global-navbar-search-dropdown"
        ref={node => (this.node = node)}>
        <form className="navbar-search">
          <div className="menu-search menu-search-full-width">
            <div className="note navbar-search-subtitle">
              {translate('search.shortcut')}
            </div>

            {this.state.loading
              ? <i className="navbar-search-icon spinner" />
              : <i className="navbar-search-icon icon-search" />}

            <input
              autoComplete="off"
              autoFocus={true}
              className="search-box-input js-search-input"
              maxLength="30"
              name="q"
              onChange={this.handleQueryChange}
              onKeyDown={this.handleKeyDown}
              placeholder={translate('search_verb')}
              type="search"
              value={this.state.query}
            />
          </div>

          <ul className="menu">
            {this.renderComponents()}
          </ul>
        </form>
      </div>
    );
  }
}
