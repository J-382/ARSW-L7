package edu.eci.arsw.collabpaint;

import java.util.Collections;
import java.util.Currency;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import com.fasterxml.jackson.databind.util.JSONPObject;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

import edu.eci.arsw.collabpaint.model.*;

@Controller
public class STOMPMessagesHandler {
	
	@Autowired
	SimpMessagingTemplate msgt;

	private static ConcurrentHashMap<String, List<Point>> polygons = new ConcurrentHashMap<String, List<Point>>();
	private static ConcurrentHashMap<String, List<Point>> topics = new ConcurrentHashMap<String, List<Point>>();

	@MessageMapping("/app/newpoint.{numdibujo}")    
	public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
		topics.get(numdibujo).add(pt);
		msgt.convertAndSend("/app/newpoint."+numdibujo, pt);

		polygons.get(numdibujo).add(pt);
		if(polygons.get(numdibujo).size() == 4){
			msgt.convertAndSend("/app/newpolygon."+numdibujo, polygons.get(numdibujo));
			polygons.get(numdibujo).clear();
		}
	}

	@SubscribeMapping("/app/newpoint.{numdibujo}")
	public List<Point> initialReply(@DestinationVariable String numdibujo) throws Exception {
		List<Point> current;
		if (topics.containsKey(numdibujo)) current = topics.get(numdibujo);
		else {
			topics.put(numdibujo, Collections.synchronizedList(new LinkedList<Point>()));
			current = topics.get(numdibujo);
		}
		return current;
	}

	@SubscribeMapping("/app/newpolygon.{numdibujo}")
	public List<Point> initialPolygonReply(@DestinationVariable String numdibujo) throws Exception {
		List<Point> current;
		if (polygons.containsKey(numdibujo)) current = polygons.get(numdibujo);
		else {
			polygons.put(numdibujo, Collections.synchronizedList(new LinkedList<Point>()));
			current = polygons.get(numdibujo);
		}
		return current;
	}

}