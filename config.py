#!/usr/bin/python3
import os
import sys
import yaml

class Config(object):
  
  # define constructor method
  # -------------------------
  def __init__(self, yaml_config):
    self.config = yaml_config

  # return the YAML config as a hash
  # --------------------------------
  def load_config(self):
    with open(self.config, 'r') as config:
      return yaml.safe_load(config)
