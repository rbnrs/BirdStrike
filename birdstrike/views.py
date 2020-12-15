
from django.http import HttpResponse
from django.http import JsonResponse
from django.shortcuts import render
import json
import os
from django.template import Context
from birdstrike.models import BirdsLog
from django.core import serializers

def home(request):
    context = {
        
    }
    return render(request, "home.html", context)

def default(request): 
    return HttpResponse("Default")    

def jsonData(request):  
    start = "14:00"
    end = "15:00"
    result_birds = list(BirdsLog.objects.raw("SELECT * FROM birdstrike.birds_log WHERE TIME(birds_log.time) <= time('"+end+"') AND (birds_log.time) > time('"+start+"');"))
    result_json = serializers.serialize('json', result_birds)
    return HttpResponse(result_json, content_type='application/json')
    
   # with open('static/testdata'+str(num)+'.json') as json_file:
    #    list_birds = json.load(json_file)
    #   return JsonResponse(list_birds, safe=False)    