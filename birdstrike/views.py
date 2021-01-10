
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
import json
import os
import time
from django.template import Context
from birdstrike.models import BirdsLog, Georef
from django.core import serializers
from datetime import datetime


def birdstrike(request):
    context = {
        
    }
    return render(request, "birdstrike.html", context)

def _getBirdsLog(startTime, endTime): 
    query = "SELECT * FROM birdstrike.birds_log WHERE TIME(birds_log.time) <= time('"+startTime+"') AND (birds_log.time) > time('"+endTime+"');"
    result_birds = list(BirdsLog.objects.raw(query))
    result_list = list()
    for bird in result_birds:
        result_list.append(
            [bird.logid, bird.lat, bird.lng, bird.alt, bird.time])
    return result_list  


def _getBirdsLogTest():
    limit = int(1000000)
    result_birds = list(BirdsLog.objects.raw("SELECT * FROM birdstrike.birds_log LIMIT " + str(limit) +"; "))
    result_list = list()
    for bird in result_birds:
        result_list.append(
            [bird.logid, bird.lat, bird.lng, bird.alt, bird.time])
    return result_list; 

def _getGeoRef(): 

    result_geo = list(Georef.objects.raw("SELECT * FROM birdstrike.georef;"))
    return result_geo

def jsonData(request, typeR, startT, endT): 
    starttime = datetime.now()
    result_json = None
    if(typeR == "birds"): 
        result_json = _getBirdsLog(startT, endT)
    if(typeR == "georef"): 
        result_json = serializers.serialize('json', _getGeoRef())
    return JsonResponse(result_json, safe=False)