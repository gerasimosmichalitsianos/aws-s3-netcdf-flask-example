#!/usr/bin/python3
import os
import sys
import re
import datetime
import s3fs
import numpy as np
import socket

from netCDF4 import Dataset
from collections import OrderedDict
from flask import Flask, redirect, request, render_template, url_for, jsonify

application = Flask(__name__)
params = {
  'timeout': 100
}

@application.route('/')
def home():
  page_data = OrderedDict()
  return render_template('index.html', page_data = page_data, **params) 

@application.route('/get_netcdf_variable', methods = ['POST'])
def get_netcdf_variable():
  if request.method == "POST":

    #arr = ds[netcdf_variable][:]
    # first we need to set up environment variables for our AWS credentials
    # --------------------------------------------------------------------- 
    results = {}
    aws_access_key_id = os.environ.get('ACCESS_KEY') 
    aws_secret_access_key = os.environ.get('SECRET_ACCESS_KEY')
    if not aws_access_key_id or not aws_secret_access_key:
      return {'processed': 'false: unable to obtain AWS credentials from environment vars.'}

    # get json input from ajax request
    # --------------------------------
    input_params = request.get_json()

    # get parameters
    # --------------
    netcdf_path = input_params['netcdf_path'] # from ajax() call from Javascript

    # read the latitude, longitude, and other variable of interest (that was passed-in)
    # ---------------------------------------------------------------------------------
    timeout = params['timeout'] 
    s3fs.S3FileSystem.read_timeout = timeout
    s3fs.S3FileSystem.connect_timeout = timeout

    s3 = s3fs.S3FileSystem(
      anon = False,
      key = aws_access_key_id,
      secret = aws_secret_access_key,
      config_kwargs = {"connect_timeout": timeout, "read_timeout": timeout})
 
    # open netcdf4 file in s3 bucket as a binary file
    # -----------------------------------------------
    with s3.open(netcdf_path, 'rb') as f:
      nc_bytes = f.read()
    
    # read netcdf4 file in the "usual" way with netcdf4 library
    # using in-memory dataset
    # ---------------------------------------------------------
    ds = Dataset(f'inmemory.nc', memory = nc_bytes)
    lats = np.array(ds['latitude'][:], dtype = np.float32)
    lngs = np.array(ds['longitude'][:], dtype = np.float32)
    temps = np.array(ds['csr_bt_08'][:], dtype = np.float32)
    temps[(temps < 0)] = 0
    max_value = temps.max() 

    # close out the netcdf file
    # -------------------------
    ds.close()
 
    # remove no_data values (-999.0) and flatten the array
    # and convert to list[] using ndarray.tolist()
    # size may be ~48000 pixels after filtering give or take
    # ------------------------------------------------------
    lats = lats.flatten().tolist()
    lngs = lngs.flatten().tolist()
    temps = temps.flatten().tolist()

    results['processed'] = 'true' 
    results['lats'] = ','.join([str(v) for v in lats])
    results['lngs'] = ','.join([str(v) for v in lngs])
    results['temps'] = ','.join([str(v) for v in temps])
    results['min'] = str(0.0)
    results['max'] = str(max_value)
    return jsonify(results)    
 
  results = {'processed': 'false'}
  return jsonify(results)

if __name__ == '__main__':
  socket.setdefaulttimeout(10) # seconds
  application.run(debug=True)
