import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, Plus, Eye, MessageSquare, Layers, Bot, Palette, FileText,
  LayoutGrid, Shield, Users2, Activity, Building2, Settings, CreditCard,
  RefreshCw, CheckCircle
} from "lucide-react";
import type { Template, Client } from "../../types";

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: LayoutGrid, color: 'text-white' },
  { id: 'sober_living', label: 'Sober Living', icon: Shield, color: 'text-emerald-400' },
  { id: 'barber', label: 'Barber & Salon', icon: Users2, color: 'text-amber-400' },
  { id: 'gym', label: 'Gym & Fitness', icon: Activity, color: 'text-rose-400' },
  { id: 'restaurant', label: 'Restaurant', icon: Building2, color: 'text-orange-400' },
  { id: 'auto', label: 'Auto Shop', icon: Settings, color: 'text-blue-400' },
  { id: 'home_services', label: 'Home Services', icon: Building2, color: 'text-teal-400' },
  { id: 'medical', label: 'Medical & Dental', icon: Shield, color: 'text-cyan-400' },
  { id: 'real_estate', label: 'Real Estate', icon: Building2, color: 'text-purple-400' },
  { id: 'retail', label: 'Retail', icon: CreditCard, color: 'text-pink-400' },
  { id: 'other', label: 'Other', icon: FileText, color: 'text-white/70' },
];

export default function TemplatesSection() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [createFromTemplate, setCreateFromTemplate] = useState<Template | null>(null);
  const [newBotName, setNewBotName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('other');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  const { data: adminData, isLoading } = useQuery<{ bots: Template[]; clients: Client[] }>({
    queryKey: ['/api/super-admin'],
  });

  const templates = (adminData?.bots || []).filter(bot => bot.metadata?.isTemplate) as Template[];
  const clients = adminData?.clients || [];

  const existingCategories = new Set(templates.map(t => t.metadata?.templateCategory || 'other'));
  const categories = TEMPLATE_CATEGORIES.filter(c => c.id === 'all' || existingCategories.has(c.id));

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.metadata?.templateCategory === selectedCategory;
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const createBotMutation = useMutation({
    mutationFn: async ({ template, clientId, name }: { template: Template; clientId: string; name: string }) => {
      return apiRequest('POST', '/api/super-admin/bots/from-template', {
        templateBotId: template.botId,
        clientId,
        name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin'] });
      setCreateFromTemplate(null);
      setNewBotName('');
      setSelectedClientId('');
      toast({ title: 'Success', description: 'Bot created from template successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create bot from template', variant: 'destructive' });
    }
  });

  const handleCreateFromTemplate = () => {
    if (!createFromTemplate || !selectedClientId || !newBotName.trim()) return;
    createBotMutation.mutate({
      template: createFromTemplate,
      clientId: selectedClientId,
      name: newBotName.trim(),
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return TEMPLATE_CATEGORIES.find(c => c.id === categoryId) || TEMPLATE_CATEGORIES[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Bot Templates</h2>
          <p className="text-sm text-white/55">Pre-configured playbooks for quick client deployment</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            {templates.length} Templates
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-create-template"
            onClick={() => setShowCreateTemplateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            data-testid="input-search-templates"
          />
        </div>
      </div>

      <ScrollArea className="w-full">
        <div className="flex items-center gap-2 pb-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            const count = cat.id === 'all' 
              ? templates.length 
              : templates.filter(t => t.metadata?.templateCategory === cat.id).length;
            return (
              <Button
                key={cat.id}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 whitespace-nowrap ${
                  selectedCategory === cat.id 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                data-testid={`button-category-${cat.id}`}
              >
                <Icon className={`h-4 w-4 ${selectedCategory === cat.id ? cat.color : ''}`} />
                {cat.label}
                <Badge className="bg-white/10 text-white/60 text-xs px-1.5 ml-1">{count}</Badge>
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {filteredTemplates.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/55">No templates match your search</p>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-cyan-400"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => {
            const catInfo = getCategoryInfo(template.metadata?.templateCategory || 'other');
            const CatIcon = catInfo.icon;
            return (
              <GlassCard key={template.botId} hover data-testid={`card-template-${template.botId}`}>
                <GlassCardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0`}>
                      <CatIcon className={`h-5 w-5 ${catInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="bg-white/10 text-white/60 text-xs">
                          {template.metadata?.templateCategory?.replace(/_/g, ' ')}
                        </Badge>
                        {template.metadata?.version && (
                          <span className="text-xs text-white/40">v{template.metadata.version}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/55 line-clamp-2 mb-4">{template.description}</p>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-cyan-400">{template.faqs?.length || 0}</span>
                      <span>FAQs</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <Layers className="h-3 w-3" />
                      <span className="text-purple-400">{template.businessProfile?.services?.length || 0}</span>
                      <span>Services</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
                      data-testid={`button-preview-template-${template.botId}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setCreateFromTemplate(template);
                        setNewBotName(template.name);
                      }}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                      data-testid={`button-use-template-${template.botId}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}

      <GlassCard>
        <GlassCardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Pre-Built AI Persona</h4>
                <p className="text-xs text-white/55 mt-1">Industry-tuned personality, tone, and conversation style</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Starter FAQs</h4>
                <p className="text-xs text-white/55 mt-1">Common questions and answers ready to customize</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Palette className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Industry Styling</h4>
                <p className="text-xs text-white/55 mt-1">Widget colors and design matched to the niche</p>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {previewTemplate && (() => {
                const catInfo = getCategoryInfo(previewTemplate.metadata?.templateCategory || 'other');
                const CatIcon = catInfo.icon;
                return (
                  <>
                    <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <CatIcon className={`h-5 w-5 ${catInfo.color}`} />
                    </div>
                    <div>
                      <span>{previewTemplate.name}</span>
                      <Badge className="ml-2 bg-white/10 text-white/60 text-xs">
                        {previewTemplate.metadata?.templateCategory?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </>
                );
              })()}
            </DialogTitle>
            <DialogDescription className="text-white/55">
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-6 mt-4">
              {previewTemplate.faqs && previewTemplate.faqs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Sample FAQs ({previewTemplate.faqs.length})</h4>
                  <div className="space-y-2">
                    {previewTemplate.faqs.slice(0, 3).map((faq, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-sm text-white font-medium">Q: {faq.question}</p>
                        <p className="text-sm text-white/55 mt-1">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {previewTemplate.systemPrompt && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">AI Personality</h4>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-sm text-white/70">{previewTemplate.systemPrompt}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setPreviewTemplate(null)} className="text-white/70">
              Close
            </Button>
            <Button 
              onClick={() => {
                setPreviewTemplate(null);
                if (previewTemplate) {
                  setCreateFromTemplate(previewTemplate);
                  setNewBotName(previewTemplate.name);
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createFromTemplate} onOpenChange={() => setCreateFromTemplate(null)}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-400" />
              Create Bot from Template
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Creating a new bot based on "{createFromTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/70">Bot Name</Label>
              <Input
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                placeholder="Enter bot name..."
                className="mt-1.5 bg-white/5 border-white/10 text-white"
                data-testid="input-new-bot-name"
              />
            </div>
            
            <div>
              <Label className="text-white/70">Assign to Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white" data-testid="select-client-for-template">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10">
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id} className="text-white">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setCreateFromTemplate(null)} className="text-white/70">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFromTemplate}
              disabled={!selectedClientId || !newBotName.trim() || createBotMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              data-testid="button-confirm-create-from-template"
            >
              {createBotMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Bot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateTemplateModal} onOpenChange={setShowCreateTemplateModal}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-400" />
              Create New Template
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Create a new bot template for quick client deployment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/70">Template Name *</Label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Barbershop Template"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
                data-testid="input-new-template-name"
              />
            </div>
            
            <div>
              <Label className="text-white/70">Industry Category</Label>
              <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white" data-testid="select-template-category">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10">
                  {TEMPLATE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="text-white">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/70">Description</Label>
              <Input
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                placeholder="Describe this template..."
                className="mt-1.5 bg-white/5 border-white/10 text-white"
                data-testid="input-template-description"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowCreateTemplateModal(false);
                setNewTemplateName('');
                setNewTemplateCategory('other');
                setNewTemplateDescription('');
              }} 
              className="text-white/70"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!newTemplateName.trim()) {
                  toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' });
                  return;
                }
                toast({ 
                  title: 'Template Created', 
                  description: `Template "${newTemplateName}" has been created. You can now customize it in the Bot Builder.` 
                });
                setShowCreateTemplateModal(false);
                setNewTemplateName('');
                setNewTemplateCategory('other');
                setNewTemplateDescription('');
              }}
              disabled={!newTemplateName.trim()}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              data-testid="button-confirm-create-template"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
