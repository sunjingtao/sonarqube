/*
 * Sonar, open source software quality management tool.
 * Copyright (C) 2008-2012 SonarSource
 * mailto:contact AT sonarsource DOT com
 *
 * Sonar is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * Sonar is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with Sonar; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02
 */
package org.sonar.batch.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.sonar.api.BatchComponent;
import org.sonar.api.Property;
import org.sonar.api.config.Settings;

/**
 * @since 3.4
 */
@Property(key = "sonar.local", defaultValue = "false", name = "Local Mode")
public class LocalMode implements BatchComponent {
  private static final Logger LOG = LoggerFactory.getLogger(LocalMode.class);

  private final boolean enabled;

  public LocalMode(Settings settings) {
    enabled = settings.getBoolean("sonar.local");
  }

  public boolean isEnabled() {
    return enabled;
  }

  public void start() {
    if (enabled) {
      LOG.info("Local Mode");
    }
  }
}
