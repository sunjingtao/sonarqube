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
import { shallow } from 'enzyme';
import type { ShallowWrapper } from 'enzyme';
import GlobalNavSearchForm from '../GlobalNavSearchForm';
import { elementKeydown } from '../../../../../helpers/testUtils';

function render(props?: Object) {
  return shallow(
    // $FlowFixMe
    <GlobalNavSearchForm
      appState={{ organizationsEnabled: false }}
      currentUser={{ isLoggedIn: false }}
      onClose={jest.fn()}
      {...props}
    />
  );
}

function component(key: string, qualifier: string = 'TRK') {
  return { key, name: key, qualifier };
}

function next(form: ShallowWrapper, expected: string) {
  elementKeydown(form.find('input'), 40);
  expect(form.state().selected).toBe(expected);
}

function prev(form: ShallowWrapper, expected: string) {
  elementKeydown(form.find('input'), 38);
  expect(form.state().selected).toBe(expected);
}

function select(form: ShallowWrapper, expected: string) {
  // $FlowFixMe
  form.instance().handleSelect(expected);
  expect(form.state().selected).toBe(expected);
}

it('renders different components and dividers between them', () => {
  const form = render();
  form.setState({
    results: {
      TRK: [component('foo'), component('bar')],
      BRC: [component('qwe', 'BRC'), component('qux', 'BRC')],
      FIL: [component('zux', 'FIL')]
    }
  });
  expect(form.find('.menu')).toMatchSnapshot();
});

it('renders "Show More" link', () => {
  const form = render();
  form.setState({
    more: { TRK: 175, BRC: 0 },
    results: {
      TRK: [component('foo'), component('bar')],
      BRC: [component('qwe', 'BRC'), component('qux', 'BRC')]
    }
  });
  expect(form.find('.menu')).toMatchSnapshot();
});

it('selects results', () => {
  const form = render();
  form.setState({
    results: {
      TRK: [component('foo'), component('bar')],
      BRC: [component('qwe', 'BRC')]
    },
    selected: 'foo'
  });
  expect(form.state().selected).toBe('foo');
  next(form, 'bar');
  next(form, 'qwe');
  next(form, 'qwe');
  prev(form, 'bar');
  select(form, 'foo');
  prev(form, 'foo');
});

it('opens selected on enter', () => {
  const form = render();
  form.setState({
    results: { TRK: [component('foo')] },
    selected: 'foo'
  });
  const openSelected = jest.fn();
  // $FlowFixMe
  form.instance().openSelected = openSelected;
  elementKeydown(form.find('input'), 13);
  expect(openSelected).toBeCalled();
});

it('closes on escape', () => {
  const onClose = jest.fn();
  const form = render({ onClose });
  elementKeydown(form.find('input'), 27);
  expect(onClose).toBeCalled();
});
