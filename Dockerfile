# we will create Ubuntu-Linux run-time environment, and
# install python over it
# -----------------------------------------------------
FROM ubuntu:latest
RUN apt-get update
RUN apt-get install -y python3-pip

# install netcdf4 dependencies for ubuntu Linux
# operating system 
# ---------------------------------------------
RUN apt-get install -y libhdf5-serial-dev netcdf-bin libnetcdf-dev
COPY . .

# install python dependencies
# ---------------------------
RUN pip3 install -r requirements.txt
RUN export FLASK_APP="application.py"

# expose port 5000 from container and run
# the app.
# ---------------------------------------
EXPOSE 5000
ADD application.py /
ENTRYPOINT ["python3", "application.py"]
