'use client';

import React from 'react';
import '../styles/globals.css';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  List,
  ListItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { theme } from '../themes/theme';
import {
  ArrowOutward,
  ChatBubbleOutline,
  CollectionsBookmarkOutlined,
  EmojiEventsOutlined,
  FaceRetouchingNaturalOutlined,
  PeopleAltOutlined,
  PermPhoneMsgRounded,
  QueryStatsOutlined,
  SchoolOutlined,
  StarBorderRounded,
  TaskAltOutlined,
  ThumbUpAltOutlined,
  WbIncandescentOutlined,
} from '@mui/icons-material';
import Image from 'next/image';
import imgBanner from '../assets/imgLandingPage.png';
import imgProfessor from '../assets/profesor-landing.jpg';
import imgAluno from '../assets/aluno-landing.jpg';
import { blue, deepPurple, orange } from '@mui/material/colors';

const cards = [
  {
    icon: <CollectionsBookmarkOutlined />,
    title: 'Gestão de Tarefas',
    description:
      'Professores criam atividades de múltipla escolha e abertas com correção automática',
    color: blue[500],
    bgColor: blue[50],
  },
  {
    icon: <EmojiEventsOutlined />,
    title: 'Gamificação',
    description:
      'Sistema de pontos, conquistas e rankings para motivar os alunos',
    color: '#FFB109',
    bgColor: '#FFF4D1',
  },
  {
    icon: <PeopleAltOutlined />,
    title: 'Multi-Tenant',
    description: 'Cada escola tem seu próprio ambiente isolado e seguro',
    color: '#A582F1',
    bgColor: '#EBE2FF',
  },
  {
    icon: <QueryStatsOutlined />,
    title: 'Relatórios Avançados',
    description:
      'Acompanhe o progresso dos alunos e performance da turma em tempo real',
    color: '#FF7948',
    bgColor: '#FAE2C6',
  },
  {
    icon: <ChatBubbleOutline />,
    title: 'Comunicação Integrada',
    description: 'Chat interno entre professores, alunos e pais',
    color: '#5CCD9F',
    bgColor: '#EDFFEF',
  },
  {
    icon: <FaceRetouchingNaturalOutlined />,
    title: 'Personalização',
    description:
      'Adapte a plataforma às necessidades específicas da sua escola',
    color: '#FF6D70',
    bgColor: '#FFE3E3',
  },
];

export default function Home() {
  return (
    <Container
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.paper,
        padding: 0,
      }}
      disableGutters
      maxWidth={false}
    >
      <Box sx={{ backgroundColor: '#F2F7FF' }} paddingX={20}>
        {/* HEADER */}
        <AppBar
          color="transparent"
          position="static"
          sx={{ boxShadow: 'none' }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box display={'flex'} alignItems="center" gap={1}>
              <Avatar
                sx={{ bgcolor: theme.palette.primary.main, borderRadius: 3 }}
              >
                <SchoolOutlined
                  sx={{ color: theme.palette.background.paper }}
                  fontSize="medium"
                />
              </Avatar>
              <Typography
                variant="h4"
                fontWeight={600}
                color={theme.palette.text.primary}
              >
                Educa+
              </Typography>
            </Box>
            <Box display={'flex'} alignItems="center" gap={1}>
              <List sx={{ display: 'flex', gap: 2 }}>
                <ListItem>
                  <Typography
                    sx={{
                      color: theme.palette.text.disabled,
                      cursor: 'pointer',
                      ':hover': { color: theme.palette.primary.main },
                      fontSize: 16,
                    }}
                  >
                    Funcionalidades
                  </Typography>
                </ListItem>
                <ListItem>
                  <Typography
                    sx={{
                      color: theme.palette.text.disabled,
                      cursor: 'pointer',
                      ':hover': { color: theme.palette.primary.main },
                    }}
                  >
                    Benefícios
                  </Typography>
                </ListItem>
                <ListItem>
                  <Typography
                    sx={{
                      color: theme.palette.text.disabled,
                      cursor: 'pointer',
                      ':hover': { color: theme.palette.primary.main },
                    }}
                  >
                    Preços
                  </Typography>
                </ListItem>
                <ListItem>
                  <Typography
                    sx={{
                      color: theme.palette.text.disabled,
                      cursor: 'pointer',
                      ':hover': { color: theme.palette.primary.main },
                    }}
                  >
                    Contato
                  </Typography>
                </ListItem>
              </List>
            </Box>
            <Box display={'flex'} alignItems="center" gap={2}>
              <Button
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  textTransform: 'none',
                  border: `1px solid ${theme.palette.grey[400]}`,
                  fontSize: theme.typography.body1,
                  fontWeight: 500,
                  paddingX: 1,
                }}
              >
                Entrar
              </Button>
              <Button
                sx={{
                  backgroundColor: theme.palette.text.primary,
                  color: theme.palette.background.paper,
                  textTransform: 'none',
                  fontSize: theme.typography.body1,
                  fontWeight: 500,
                  paddingX: 1,
                }}
              >
                Entrar em Contato
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Box
          display={'flex'}
          gap={3}
          justifyContent={'center'}
          paddingY={10}
          flexDirection={'column'}
          alignItems={'center'}
        >
          <Typography
            variant={`h1`}
            fontSize={'64px'}
            color={theme.palette.text.primary}
            fontWeight={700}
            textAlign={'center'}
            maxWidth={'900px'}
          >
            Revolucione a{' '}
            <Typography
              component={'span'}
              variant={`h1`}
              fontSize={'64px'}
              color={theme.palette.primary.main}
            >
              Educação
            </Typography>{' '}
            da sua escola
          </Typography>
          <Typography
            variant={`h5`}
            color={theme.palette.text.disabled}
            fontWeight={400}
            textAlign={'center'}
            maxWidth={'800px'}
          >
            Plataforma completa para gestão educacional com gamificação,
            multi-tenant e ferramentas avançadas para professores e alunos.
          </Typography>
          <Box display={'flex'} gap={2}>
            <Button
              sx={{
                fontSize: theme.typography.h5,
                backgroundColor: theme.palette.text.primary,
                paddingX: 2,
                paddingY: 1,
                color: 'white',
                border: `1px solid inherit`,
                ':hover': { backgroundColor: theme.palette.primary.main },
              }}
              startIcon={<PermPhoneMsgRounded />}
            >
              Entrar em contato
            </Button>
            <Button
              sx={{
                fontSize: theme.typography.h5,
                backgroundColor: theme.palette.background.paper,
                paddingX: 2,
                paddingY: 1,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.grey[400]}`,
                ':hover': { backgroundColor: theme.palette.grey[100] },
              }}
              endIcon={<ArrowOutward />}
            >
              Ver Demonstração
            </Button>
          </Box>
        </Box>
        <Box display={'flex'} justifyContent="center" paddingBottom={10}>
          <Image
            src={imgBanner}
            alt="Imagem do banner da landing page"
            style={{ borderRadius: 20, boxShadow: '0px 10px 10px #00000024' }}
            objectFit="cover"
          />
        </Box>
      </Box>
      <Box
        paddingX={20}
        paddingY={10}
        textAlign={'center'}
        component={'section'}
      >
        <Typography variant="h2" color={theme.palette.text.primary}>
          Funcionalidades Completas
          <Typography
            variant="body1"
            fontWeight={400}
            fontSize={18}
            marginTop={2}
            sx={{ color: theme.palette.text.secondary }}
          >
            Tudo que sua escola precisa para uma experiência educacional moderna
            e eficiente
          </Typography>
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns="repeat(3, 1fr)"
          gap={4}
          marginTop={5}
          sx={{
            maxWidth: 1240,
            marginX: 'auto',
          }}
        >
          {cards.map((card) => (
            <Card
              key={card.title}
              sx={{
                maxWidth: 400,
                width: '100%',
                border: `1px solid ${theme.palette.grey[300]}`,
                boxShadow: 'none',
                borderRadius: 2,
                padding: 1,
                ':hover': {
                  boxShadow: '0px 4px 20px #00000014',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 1,
                    bgcolor: card.bgColor,
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 2,
                  }}
                >
                  {card.icon}
                </Box>
                <Typography
                  variant="body1"
                  fontWeight={500}
                  marginTop={1}
                  textAlign="left"
                  color={theme.palette.text.primary}
                >
                  {card.title}
                </Typography>
                <Typography
                  variant="body1"
                  textAlign="left"
                  color={theme.palette.grey[600]}
                  fontWeight={400}
                >
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
      <Box paddingX={20} paddingY={10} bgcolor={theme.palette.grey[100]}>
        <Box display={'flex'} flexDirection={'column'} marginBottom={5}>
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <Box>
              <Typography variant="h3" color={theme.palette.text.primary}>
                Para Professores
              </Typography>
              <List>
                <ListItem disableGutters>
                  <TaskAltOutlined
                    sx={{ color: theme.palette.success.main, marginRight: 2 }}
                  />
                  <Box>
                    <Typography
                      variant="h6"
                      color={theme.palette.text.primary}
                      fontWeight={500}
                    >
                      Criação Rápida de Atividades
                    </Typography>
                    <Typography
                      variant="body1"
                      color={theme.palette.text.secondary}
                    >
                      Interface intuitiva para criar tarefas e provas em minutos
                    </Typography>
                  </Box>
                </ListItem>
                <ListItem disableGutters>
                  <TaskAltOutlined
                    sx={{ color: theme.palette.success.main, marginRight: 2 }}
                  />
                  <Box>
                    <Typography
                      variant="h6"
                      color={theme.palette.text.primary}
                      fontWeight={500}
                    >
                      Correção Automática
                    </Typography>
                    <Typography
                      variant="body1"
                      color={theme.palette.text.secondary}
                    >
                      Questões de múltipla escolha corrigidas automaticamente
                    </Typography>
                  </Box>
                </ListItem>
                <ListItem disableGutters>
                  <TaskAltOutlined
                    sx={{ color: theme.palette.success.main, marginRight: 2 }}
                  />
                  <Box>
                    <Typography
                      variant="h6"
                      color={theme.palette.text.primary}
                      fontWeight={500}
                    >
                      Relatórios Detalhados
                    </Typography>
                    <Typography
                      variant="body1"
                      color={theme.palette.text.secondary}
                    >
                      Acompanhe o progresso individual e da turma
                    </Typography>
                  </Box>
                </ListItem>
              </List>
            </Box>
            <Box display="flex" justifyContent="center" marginTop={4}>
              <Box
                component={'img'}
                src={imgProfessor.src}
                alt="Professor usando a plataforma"
                sx={{
                  borderRadius: 2,
                  boxShadow: '0px 10px 10px #00000024',
                  width: '100%',
                  maxWidth: 700,
                }}
              />
            </Box>
          </Box>
        </Box>
        <Box
          display={'flex'}
          alignItems={'center'}
          justifyContent={'flex-end'}
          gap={5}
          flexDirection={'row-reverse'}
        >
          <Box>
            <Typography variant="h3" color={theme.palette.text.primary}>
              Para Alunos
            </Typography>
            <List>
              <ListItem disableGutters>
                <StarBorderRounded
                  sx={{ color: orange[400], marginRight: 2 }}
                />
                <Box>
                  <Typography
                    variant="h6"
                    color={theme.palette.text.primary}
                    fontWeight={500}
                  >
                    Aprendizado Gamificado
                  </Typography>
                  <Typography
                    variant="body1"
                    color={theme.palette.text.secondary}
                  >
                    Ganhe pontos, conquistas e veja seu progresso
                  </Typography>
                </Box>
              </ListItem>
              <ListItem disableGutters>
                <ThumbUpAltOutlined sx={{ color: blue[500], marginRight: 2 }} />
                <Box>
                  <Typography
                    variant="h6"
                    color={theme.palette.text.primary}
                    fontWeight={500}
                  >
                    Feedback Instantâneo
                  </Typography>
                  <Typography
                    variant="body1"
                    color={theme.palette.text.secondary}
                  >
                    Receba suas notas e comentários imediatamente
                  </Typography>
                </Box>
              </ListItem>
              <ListItem disableGutters>
                <WbIncandescentOutlined
                  sx={{ color: deepPurple[300], marginRight: 2 }}
                />
                <Box>
                  <Typography
                    variant="h6"
                    color={theme.palette.text.primary}
                    fontWeight={500}
                  >
                    Interface Intuitiva
                  </Typography>
                  <Typography
                    variant="body1"
                    color={theme.palette.text.secondary}
                  >
                    Fácil de usar, focado na experiência do estudante
                  </Typography>
                </Box>
              </ListItem>
            </List>
          </Box>
          <Box display="flex" justifyContent="center" marginTop={4}>
            <Box
              component={'img'}
              src={imgAluno.src}
              alt="Aluno segurando um livro"
              sx={{
                borderRadius: 2,
                boxShadow: '0px 10px 10px #00000024',
                width: '100%',
                maxWidth: 700,
              }}
            />
          </Box>
        </Box>
      </Box>
      <Box
        display={'flex'}
        flexDirection={'column'}
        paddingX={20}
        paddingY={5}
        component={'section'}
        bgcolor={theme.palette.primary.main}
      >
        <Typography
          variant="h2"
          color={theme.palette.background.paper}
          textAlign={'center'}
        >
          Números que Impressionam
        </Typography>
        <Typography
          variant="h5"
          color={theme.palette.primary.light}
          textAlign={'center'}
          fontWeight={400}
          marginTop={2}
        >
          Resultados comprovados em escolas que já usam nossa plataforma
        </Typography>
        <List
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 1300,
            paddingY: 5,
            alignSelf: 'center',
          }}
        >
          <ListItem
            disableGutters
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            <Typography
              variant="body1"
              color={theme.palette.background.paper}
              textAlign={'center'}
              fontSize={40}
              fontWeight={700}
            >
              95%
            </Typography>
            <Typography
              variant="body1"
              color={theme.palette.primary.light}
              textAlign={'center'}
              fontSize={20}
            >
              Satisfação dos Professores
            </Typography>
          </ListItem>
          <ListItem
            disableGutters
            sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
          >
            <Typography
              variant="body1"
              color={theme.palette.background.paper}
              textAlign={'center'}
              fontSize={40}
              fontWeight={700}
            >
              40%
            </Typography>
            <Typography
              variant="body1"
              color={theme.palette.primary.light}
              textAlign={'center'}
              fontSize={20}
            >
              Aumento no Engajamento
            </Typography>
          </ListItem>
          <ListItem
            disableGutters
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            <Typography
              variant="body1"
              color={theme.palette.background.paper}
              textAlign={'center'}
              fontSize={40}
              fontWeight={700}
            >
              25%
            </Typography>
            <Typography
              variant="body1"
              color={theme.palette.primary.light}
              textAlign={'center'}
              fontSize={20}
            >
              Melhoria nas Notas
            </Typography>
          </ListItem>
          <ListItem
            disableGutters
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            <Typography
              variant="body1"
              color={theme.palette.background.paper}
              textAlign={'center'}
              fontSize={40}
              fontWeight={700}
            >
              100+
            </Typography>
            <Typography
              variant="body1"
              color={theme.palette.primary.light}
              textAlign={'center'}
              fontSize={20}
            >
              Escolas Atendidas
            </Typography>
          </ListItem>
        </List>
      </Box>
      <Box
        paddingX={20}
        paddingY={15}
        textAlign={'center'}
        component={'section'}
        bgcolor={theme.palette.background.paper}
      >
        <Typography variant="h2" color={theme.palette.text.primary}>
          Pronto para Transformar sua Escola?
        </Typography>
        <Typography
          variant="body1"
          color={theme.palette.text.secondary}
          margin={'auto'}
          fontWeight={400}
          marginTop={2}
          fontSize={18}
          maxWidth={800}
        >
          Junte-se às centenas de escolas que já estão revolucionando a educação
          com nossa plataforma. Entre em contato hoje mesmo para uma
          demonstração personalizada!
        </Typography>
        <Box display={'flex'} gap={2} justifyContent="center" marginTop={5}>
          <Button
            sx={{
              fontSize: theme.typography.h5,
              backgroundColor: theme.palette.text.primary,
              paddingX: 2,
              paddingY: 1,
              color: 'white',
              border: `1px solid inherit`,
              ':hover': { backgroundColor: theme.palette.primary.main },
            }}
          >
            Começar Agora
          </Button>
          <Button
            sx={{
              fontSize: theme.typography.h5,
              backgroundColor: theme.palette.background.paper,
              paddingX: 2,
              paddingY: 1,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.grey[400]}`,
              ':hover': { backgroundColor: theme.palette.grey[100] },
            }}
          >
            Falar com um Consultor
          </Button>
        </Box>
      </Box>
      <Box
        component="footer"
        bgcolor={theme.palette.secondary.main}
        paddingY={6}
        paddingX={20}
        textAlign="center"
        color={theme.palette.grey[500]}
      >
        <List disablePadding sx={{ display: 'flex', paddingY: 2 }}>
          <ListItem
            disableGutters
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <Box display={'flex'} alignItems="center" gap={1} marginBottom={2}>
              <Avatar
                sx={{ bgcolor: theme.palette.primary.main, borderRadius: 2 }}
              >
                <SchoolOutlined fontSize="small" />
              </Avatar>
              <Typography variant="h5" fontWeight={600} color={'white'}>
                Educa+
              </Typography>
            </Box>
            <Typography variant="body2" maxWidth={300}>
              Revolucionando a educação através da tecnologia e inovação.
            </Typography>
          </ListItem>
          <ListItem
            disableGutters
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <Typography
              variant="body2"
              fontWeight={500}
              color={theme.palette.background.paper}
              marginBottom={2}
              marginBottom={2}
            >
              Produto
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ':hover': { color: theme.palette.background.paper },
                marginBottom: 1,
              }}
            >
              Funcionalidades
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ':hover': { color: theme.palette.background.paper },
                marginBottom: 1,
              }}
            >
              Preços
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ':hover': { color: theme.palette.background.paper },
                marginBottom: 1,
              }}
            >
              API
            </Typography>
          </ListItem>
          <ListItem
            disableGutters
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <Typography
              variant="body2"
              fontWeight={500}
              color={theme.palette.background.paper}
              marginBottom={2}
            >
              Empresa
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ':hover': { color: theme.palette.background.paper },
                marginBottom: 1,
              }}
            >
              Sobre
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ':hover': { color: theme.palette.background.paper },
                marginBottom: 1,
              }}
            >
              Carreiras
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ':hover': { color: theme.palette.background.paper },
                marginBottom: 1,
              }}
            >
              Blog
            </Typography>
          </ListItem>
          <ListItem
            disableGutters
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <Typography
              variant="body2"
              fontWeight={500}
              color={theme.palette.background.paper}
              marginBottom={2}
            >
              Suporte
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ':hover': { color: theme.palette.background.paper },
                marginBottom: 1,
              }}
            >
              Central de Ajuda
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ':hover': { color: theme.palette.background.paper },
                marginBottom: 1,
              }}
            >
              Contato
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ':hover': { color: theme.palette.background.paper },
                marginBottom: 1,
              }}
            >
              Status
            </Typography>
          </ListItem>
        </List>
        <Divider
          sx={{ bgcolor: '#ffffff16' }}
          orientation="horizontal"
          flexItem
        />
        <Box paddingTop={5}>
          <Typography variant="body2">
            © {new Date().getFullYear()} Educa+. Todos os direitos reservados.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
