
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

def home(request):
    context = {
        
    }
    return render(request, "home.html", context)

def default(request): 
    return HttpResponse("Default")   

def _getBirdsLog(): 
    dEndDate = datetime.now()
    dHoursDate = datetime.fromtimestamp(360000/1000.0)  
    dStartDate = dEndDate - dHoursDate 
    dStartDate = time.gmtime(dStartDate.total_seconds())                                           

    result_birds = list(BirdsLog.objects.raw("SELECT * FROM birdstrike.birds_log WHERE TIME(birds_log.time) <= time('"+dEndDate.strftime('%H:%M')+"') AND (birds_log.time) > time('"+str(dStartDate.tm_hour) +":"+str(dStartDate.tm_min)+"');"))
    return result_birds  


def _getGeoRef(): 

    result_geo = list(Georef.objects.raw("SELECT * FROM birdstrike.georef;"))
    return result_geo

def jsonData(request, typeR): 
    
    result_json = None

    if(typeR == "birds"): 
        result_json = serializers.serialize('json', _getBirdsLog())
    if(typeR == "georef"): 
        result_json = serializers.serialize('json', _getGeoRef())

    return HttpResponse(result_json, content_type='application/json')
    
   # with open('static/testdata'+str(num)+'.json') as json_file:
    #    list_birds = json.load(json_file)
    #   return JsonResponse(list_birds, safe=False)    